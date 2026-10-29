import asyncio
from datetime import datetime, timezone
import logging
from pathlib import Path
from typing import Any
import fastf1
import numpy as np
import pandas as pd

from backend.app.core.config import settings
from backend.app.providers.base import F1DataProvider
from backend.app.schemas.f1 import (
    CircuitTrackMap,
    DriverClassification,
    DriverInfo,
    EventSessionSummary,
    GrandPrixEvent,
    LapData,
    RaceDashboardData,
    SeasonInfo,
    TrackCoordinate,
    TyreStint,
)

logger = logging.getLogger(__name__)


def format_timedelta(td: Any) -> str | None:
    """Format pandas Timedelta to F1 timing format (e.g., 1:32.451)."""
    if pd.isna(td) or td is None:
        return None
    try:
        total_seconds = td.total_seconds()
        minutes = int(total_seconds // 60)
        seconds = total_seconds % 60
        if minutes > 0:
            return f"{minutes}:{seconds:06.3f}"
        return f"{seconds:.3f}"
    except Exception:
        return str(td)


class FastF1Provider(F1DataProvider):
    """Production FastF1 provider with local disk caching and threadpool execution."""

    def __init__(self, cache_dir: Path | None = None) -> None:
        self.cache_dir = cache_dir or settings.CACHE_DIR
        self._init_cache()

    def _init_cache(self) -> None:
        if settings.FASTF1_CACHE_ENABLED:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            if hasattr(fastf1.Cache, "configure"):
                fastf1.Cache.configure(cache_dir=str(self.cache_dir))
            else:
                fastf1.Cache.enable_cache(str(self.cache_dir))
            logger.info("FastF1 disk cache enabled at %s", self.cache_dir)

    async def get_seasons(self) -> list[SeasonInfo]:
        """Return supported modern F1 seasons."""
        current_year = datetime.now(timezone.utc).year
        # FastF1 rich telemetry is supported from 2018 to present
        seasons = [SeasonInfo(year=y) for y in range(current_year, 2017, -1)]
        return seasons

    def _sync_get_events(self, season: int) -> list[GrandPrixEvent]:
        schedule = fastf1.get_event_schedule(season)
        events: list[GrandPrixEvent] = []

        for _, row in schedule.iterrows():
            round_num = row.get("RoundNumber", 0)
            if round_num == 0:
                continue  # Skip pre-season testing

            event_date = None
            if pd.notna(row.get("EventDate")):
                event_date = pd.to_datetime(row["EventDate"]).to_pydatetime()

            sessions: list[EventSessionSummary] = []
            for s_idx in range(1, 6):
                s_name = row.get(f"Session{s_idx}")
                if pd.notna(s_name) and s_name:
                    s_date = None
                    if pd.notna(row.get(f"Session{s_idx}DateUtc")):
                        s_date = pd.to_datetime(row[f"Session{s_idx}DateUtc"]).to_pydatetime()
                    sessions.append(
                        EventSessionSummary(
                            name=str(s_name),
                            session_type=str(s_name),
                            date=s_date,
                        )
                    )

            events.append(
                GrandPrixEvent(
                    round_number=int(round_num),
                    country=str(row.get("Country", "")),
                    location=str(row.get("Location", "")),
                    official_event_name=str(row.get("OfficialEventName", "")),
                    event_name=str(row.get("EventName", "")),
                    event_date=event_date,
                    sessions=sessions,
                )
            )
        return events

    async def get_events(self, season: int) -> list[GrandPrixEvent]:
        """Fetch season event schedule off the main thread."""
        return await asyncio.to_thread(self._sync_get_events, season)

    def _sync_get_session_dashboard(
        self, season: int, round_number: int, session_name: str
    ) -> RaceDashboardData:
        session = fastf1.get_session(season, round_number, session_name)
        session.load(telemetry=True, weather=False, messages=False)

        classification: list[DriverClassification] = []
        results = session.results

        # Extract tyre stints from laps
        driver_stints: dict[str, list[TyreStint]] = {}
        if hasattr(session, "laps") and not session.laps.empty:
            laps_df = session.laps
            for drv, grp in laps_df.groupby("DriverNumber"):
                stint_list = []
                for s_num, s_df in grp.groupby("Stint"):
                    compound = str(s_df["Compound"].iloc[0]) if pd.notna(s_df["Compound"].iloc[0]) else "UNKNOWN"
                    start_lap = int(s_df["LapNumber"].min())
                    end_lap = int(s_df["LapNumber"].max())
                    stint_list.append(
                        TyreStint(
                            stint_number=int(s_num),
                            compound=compound.upper(),
                            start_lap=start_lap,
                            end_lap=end_lap,
                            total_laps=len(s_df),
                        )
                    )
                driver_stints[str(drv)] = stint_list

        total_session_laps = int(session.laps["LapNumber"].max()) if hasattr(session, "laps") and not session.laps.empty else 0

        if results is not None and not results.empty:
            for _, row in results.iterrows():
                drv_num = str(row.get("DriverNumber", ""))
                team_name = str(row.get("TeamName", ""))
                team_color = f"#{row.get('TeamColor', 'FFFFFF')}" if pd.notna(row.get("TeamColor")) else None

                driver_info = DriverInfo(
                    driver_number=drv_num,
                    broadcast_name=str(row.get("BroadcastName", "")),
                    full_name=str(row.get("FullName", "")),
                    abbreviation=str(row.get("Abbreviation", "")),
                    team_name=team_name,
                    team_color=team_color,
                )

                fastest_lap_str = None
                fastest_lap_delta = row.get("FastestLapTime")
                if pd.notna(fastest_lap_delta):
                    fastest_lap_str = format_timedelta(fastest_lap_delta)

                position_val = int(row.get("Position", 0)) if pd.notna(row.get("Position")) else 0

                classification.append(
                    DriverClassification(
                        position=position_val,
                        driver=driver_info,
                        status=str(row.get("Status", "Finished")),
                        points=float(row.get("Points", 0.0)),
                        laps_completed=int(row.get("Laps", 0)) if pd.notna(row.get("Laps")) else 0,
                        fastest_lap_time=fastest_lap_str,
                        stints=driver_stints.get(drv_num, []),
                    )
                )

        # Sort classification by position
        classification.sort(key=lambda d: d.position if d.position > 0 else 999)

        # Extract track map from fastest lap telemetry
        track_map = None
        try:
            fastest_lap = session.laps.pick_fastest()
            if fastest_lap is not None:
                telemetry = fastest_lap.get_telemetry()
                if telemetry is not None and "X" in telemetry and "Y" in telemetry:
                    # Downsample to ~180 points for lightweight frontend SVG rendering
                    step = max(1, len(telemetry) // 180)
                    downsampled = telemetry.iloc[::step]
                    coords = [
                        TrackCoordinate(x=float(row["X"]), y=float(row["Y"]))
                        for _, row in downsampled.iterrows()
                        if pd.notna(row["X"]) and pd.notna(row["Y"])
                    ]
                    track_map = CircuitTrackMap(
                        event_name=str(session.event.get("EventName", "")),
                        year=season,
                        coordinates=coords,
                        total_points=len(coords),
                    )
        except Exception as e:
            logger.warning("Could not extract track map telemetry: %s", e)

        return RaceDashboardData(
            season=season,
            round_number=round_number,
            event_name=str(session.event.get("EventName", "")),
            session_name=session_name,
            total_laps=total_session_laps,
            classification=classification,
            track_map=track_map,
        )

    async def get_session_dashboard(
        self, season: int, round_number: int, session_name: str
    ) -> RaceDashboardData:
        """Fetch dashboard telemetry data off the main thread."""
        return await asyncio.to_thread(
            self._sync_get_session_dashboard, season, round_number, session_name
        )

    def _sync_get_driver_laps(
        self, season: int, round_number: int, session_name: str, driver_identifier: str
    ) -> list[LapData]:
        session = fastf1.get_session(season, round_number, session_name)
        session.load(telemetry=False, weather=False, messages=False)

        if not hasattr(session, "laps") or session.laps.empty:
            return []

        # Filter by driver (supports driver number '1' or abbreviation 'VER')
        driver_laps = session.laps.pick_driver(driver_identifier)
        if driver_laps.empty:
            return []

        lap_records: list[LapData] = []
        for _, row in driver_laps.iterrows():
            lap_sec = row["LapTime"].total_seconds() if pd.notna(row.get("LapTime")) else None
            lap_str = format_timedelta(row.get("LapTime"))
            s1 = row["Sector1Time"].total_seconds() if pd.notna(row.get("Sector1Time")) else None
            s2 = row["Sector2Time"].total_seconds() if pd.notna(row.get("Sector2Time")) else None
            s3 = row["Sector3Time"].total_seconds() if pd.notna(row.get("Sector3Time")) else None
            compound = str(row.get("Compound", "UNKNOWN")).upper() if pd.notna(row.get("Compound")) else None
            tyre_age = int(row.get("TyreLife", 0)) if pd.notna(row.get("TyreLife")) else None
            pos = int(row.get("Position", 0)) if pd.notna(row.get("Position")) else None

            lap_records.append(
                LapData(
                    lap_number=int(row.get("LapNumber", 0)),
                    driver_number=str(row.get("DriverNumber", driver_identifier)),
                    lap_time_seconds=lap_sec,
                    lap_time_str=lap_str,
                    sector1_seconds=s1,
                    sector2_seconds=s2,
                    sector3_seconds=s3,
                    compound=compound,
                    tyre_age=tyre_age,
                    is_accurate=bool(row.get("IsAccurate", True)),
                    position=pos,
                )
            )
        return lap_records

    async def get_driver_laps(
        self, season: int, round_number: int, session_name: str, driver_identifier: str
    ) -> list[LapData]:
        """Fetch driver laps off the main thread."""
        return await asyncio.to_thread(
            self._sync_get_driver_laps, season, round_number, session_name, driver_identifier
        )

    async def get_circuit_map(
        self, season: int, round_number: int, session_name: str
    ) -> CircuitTrackMap | None:
        dashboard = await self.get_session_dashboard(season, round_number, session_name)
        return dashboard.track_map
