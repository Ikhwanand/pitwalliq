import asyncio
from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
from typing import Any
import fastf1
import numpy as np
import pandas as pd

from backend.app.core.config import settings
from backend.app.core.dataset_cache import DatasetCache, get_dataset_cache
from backend.app.providers.base import F1DataProvider
from backend.app.schemas.f1 import (
    CircuitTrackMap,
    DriverClassification,
    DriverInfo,
    EventSessionSummary,
    GhostComparisonData,
    GhostTelemetryPoint,
    GrandPrixEvent,
    LapData,
    RaceDashboardData,
    SeasonInfo,
    TrackCoordinate,
    TrackCorner,
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


import threading

_session_cache: dict[tuple[int, int, str], Any] = {}
_session_locks: dict[tuple[int, int, str], threading.Lock] = {}
_cache_mutex = threading.Lock()


def _get_session_lock(key: tuple[int, int, str]) -> threading.Lock:
    with _cache_mutex:
        if key not in _session_locks:
            _session_locks[key] = threading.Lock()
        return _session_locks[key]


class FastF1Provider(F1DataProvider):
    """Production FastF1 provider with local disk caching and threadpool execution."""

    def __init__(self, cache_dir: Path | None = None) -> None:
        self.cache_dir = cache_dir or settings.CACHE_DIR
        self.db_cache: DatasetCache = get_dataset_cache()
        self._init_cache()

    def _init_cache(self) -> None:
        if settings.F1_USERNAME and not os.environ.get("F1_USERNAME"):
            os.environ["F1_USERNAME"] = settings.F1_USERNAME
        if settings.F1_PASSWORD and not os.environ.get("F1_PASSWORD"):
            os.environ["F1_PASSWORD"] = settings.F1_PASSWORD

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
        cached = self.db_cache.get_events(season)
        if cached and isinstance(cached, list) and len(cached) > 0:
            logger.info("Events schedule retrieved from SQLite dataset cache (0ms): Season %d", season)
            return [GrandPrixEvent(**e) for e in cached]

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

        if events:
            self.db_cache.set_events(season, [e.model_dump() for e in events])
        return events

    async def get_events(self, season: int) -> list[GrandPrixEvent]:
        """Fetch season event schedule off the main thread."""
        return await asyncio.to_thread(self._sync_get_events, season)

    def _sync_get_session_dashboard(
        self, season: int, round_number: int, session_name: str
    ) -> RaceDashboardData:
        cached = self.db_cache.get_dashboard(season, round_number, session_name)
        if cached and isinstance(cached, dict):
            logger.info("Dashboard retrieved from SQLite dataset cache (0ms): Season %d R%d (%s)", season, round_number, session_name)
            return RaceDashboardData(**cached)

        session_key = (season, round_number, session_name)
        lock = _get_session_lock(session_key)
        with lock:
            if session_key in _session_cache:
                session = _session_cache[session_key]
            else:
                session = fastf1.get_session(season, round_number, session_name)
                try:
                    # Load session results, driver classifications, and event info directly (<3s without blocking on livetiming auth)
                    session.load(laps=False, telemetry=False, weather=False, messages=False)
                except Exception as e:
                    logger.error("Could not load session metadata for Season %s R%s: %s", season, round_number, e)
                _session_cache[session_key] = session

        classification: list[DriverClassification] = []
        results = session.results

        # Extract tyre stints from laps safely without triggering DataNotLoadedError
        driver_stints: dict[str, list[TyreStint]] = {}
        has_laps = False
        try:
            laps_df = getattr(session, "_laps", None)
            if laps_df is not None and not laps_df.empty:
                has_laps = True
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
        except Exception as e:
            logger.warning("Could not extract tyre stints: %s", e)

        total_session_laps = 50
        try:
            if has_laps and session._laps is not None and not session._laps.empty:
                total_session_laps = int(session._laps["LapNumber"].max())
            elif results is not None and not results.empty and "Laps" in results.columns:
                max_laps = results["Laps"].max()
                if pd.notna(max_laps) and int(max_laps) > 0:
                    total_session_laps = int(max_laps)
        except Exception:
            pass

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
            if getattr(session, "_laps", None) is not None and not session._laps.empty:
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

        dashboard_data = RaceDashboardData(
            season=season,
            round_number=round_number,
            event_name=str(session.event.get("EventName", "")),
            session_name=session_name,
            total_laps=total_session_laps,
            classification=classification,
            track_map=track_map,
        )
        self.db_cache.set_dashboard(season, round_number, session_name, dashboard_data.model_dump())
        return dashboard_data

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
        cached = self.db_cache.get_driver_laps(season, round_number, session_name, driver_identifier)
        if cached and isinstance(cached, list) and len(cached) > 0:
            logger.info("Driver laps retrieved from SQLite dataset cache (0ms): S%d R%d #%s", season, round_number, driver_identifier)
            return [LapData(**l) for l in cached]

        session_key = (season, round_number, session_name)
        lock = _get_session_lock(session_key)
        with lock:
            cached_session = _session_cache.get(session_key)
            if (
                cached_session is not None
                and getattr(cached_session, "_laps", None) is not None
                and not cached_session._laps.empty
            ):
                session = cached_session
            else:
                session = fastf1.get_session(season, round_number, session_name)
                try:
                    session.load(laps=True, telemetry=False, weather=False, messages=False)
                    _session_cache[session_key] = session
                except Exception as e:
                    logger.warning("Could not load driver laps: %s", e)
                    return []

        if getattr(session, "_laps", None) is None or session._laps.empty:
            return []

        try:
            # Filter by driver (supports driver number '1' or abbreviation 'VER')
            driver_laps = session.laps.pick_driver(driver_identifier)
        except Exception:
            return []
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

        if lap_records:
            self.db_cache.set_driver_laps(
                season, round_number, session_name, driver_identifier, [l.model_dump() for l in lap_records]
            )
        return lap_records

    async def get_driver_laps(
        self, season: int, round_number: int, session_name: str, driver_identifier: str
    ) -> list[LapData]:
        """Fetch driver laps off the main thread."""
        return await asyncio.to_thread(
            self._sync_get_driver_laps, season, round_number, session_name, driver_identifier
        )

    def _sync_get_track_map(
        self, season: int, round_number: int, session_name: str
    ) -> CircuitTrackMap | None:
        """Extract actual circuit layout coordinates.
        Primary: Check persistent SQLite cache (<1ms response).
        Secondary: Check high-precision precomputed circuits database (<10ms response).
        Tertiary: FastF1 telemetry extraction.
        """
        cached = self.db_cache.get_track_map(season, round_number, session_name)
        if cached and isinstance(cached, dict):
            logger.info("Track map retrieved from SQLite dataset cache (0ms): S%d R%d", season, round_number)
            return CircuitTrackMap(**cached)

        # 1. Determine event name from schedule
        event_name = f"Round {round_number}"
        try:
            schedule = fastf1.get_event_schedule(season)
            match = schedule[schedule["RoundNumber"] == round_number]
            if not match.empty:
                event_name = str(match.iloc[0].get("EventName", event_name))
        except Exception:
            pass

        # 2. Check local official circuits database for instant zero-latency return
        try:
            circuits_path = Path(__file__).resolve().parent.parent / "data" / "circuits.json"
            if circuits_path.exists():
                with open(circuits_path, "r", encoding="utf-8") as f:
                    circuits_db = json.load(f)

                event_circuit_map = {
                    "bahrain": "Bahrain International Circuit",
                    "saudi": "Jeddah Corniche Circuit",
                    "jeddah": "Jeddah Corniche Circuit",
                    "australia": "Albert Park Circuit",
                    "melbourne": "Albert Park Circuit",
                    "china": "Shanghai International Circuit",
                    "chinese": "Shanghai International Circuit",
                    "shanghai": "Shanghai International Circuit",
                    "japan": "Suzuka International Racing Course",
                    "suzuka": "Suzuka International Racing Course",
                    "miami": "Miami International Autodrome",
                    "imola": "Autodromo Enzo e Dino Ferrari",
                    "emilia": "Autodromo Enzo e Dino Ferrari",
                    "monaco": "Circuit de Monaco",
                    "monte carlo": "Circuit de Monaco",
                    "canada": "Circuit Gilles-Villeneuve",
                    "canadian": "Circuit Gilles-Villeneuve",
                    "montreal": "Circuit Gilles-Villeneuve",
                    "spain": "Circuit de Barcelona-Catalunya",
                    "spanish": "Circuit de Barcelona-Catalunya",
                    "barcelona": "Circuit de Barcelona-Catalunya",
                    "catalunya": "Circuit de Barcelona-Catalunya",
                    "austria": "Red Bull Ring",
                    "austrian": "Red Bull Ring",
                    "spielberg": "Red Bull Ring",
                    "red bull ring": "Red Bull Ring",
                    "britain": "Silverstone Circuit",
                    "british": "Silverstone Circuit",
                    "silverstone": "Silverstone Circuit",
                    "united kingdom": "Silverstone Circuit",
                    "hungary": "Hungaroring",
                    "hungarian": "Hungaroring",
                    "hungaroring": "Hungaroring",
                    "belgium": "Circuit de Spa-Francorchamps",
                    "belgian": "Circuit de Spa-Francorchamps",
                    "spa": "Circuit de Spa-Francorchamps",
                    "netherlands": "Circuit Zandvoort",
                    "dutch": "Circuit Zandvoort",
                    "zandvoort": "Circuit Zandvoort",
                    "italy": "Autodromo Nazionale Monza",
                    "italian": "Autodromo Nazionale Monza",
                    "monza": "Autodromo Nazionale Monza",
                    "azerbaijan": "Baku City Circuit",
                    "baku": "Baku City Circuit",
                    "singapore": "Marina Bay Street Circuit",
                    "marina bay": "Marina Bay Street Circuit",
                    "united states": "Circuit of the Americas",
                    "austin": "Circuit of the Americas",
                    "cota": "Circuit of the Americas",
                    "mexico": "Autódromo Hermanos Rodríguez",
                    "mexican": "Autódromo Hermanos Rodríguez",
                    "brazil": "Autódromo José Carlos Pace - Interlagos",
                    "brazilian": "Autódromo José Carlos Pace - Interlagos",
                    "são paulo": "Autódromo José Carlos Pace - Interlagos",
                    "interlagos": "Autódromo José Carlos Pace - Interlagos",
                    "las vegas": "Las Vegas Street Circuit",
                    "qatar": "Losail International Circuit",
                    "lusail": "Losail International Circuit",
                    "losail": "Losail International Circuit",
                    "abu dhabi": "Yas Marina Circuit",
                    "yas marina": "Yas Marina Circuit",
                }

                ev_lower = (event_name or "").lower()
                matched_name = None
                for keyword, target_circuit in event_circuit_map.items():
                    if keyword in ev_lower:
                        matched_name = target_circuit
                        break

                matched_circuit = None
                if matched_name and matched_name in circuits_db:
                    matched_circuit = circuits_db[matched_name]
                else:
                    for c_name, c_data in circuits_db.items():
                        c_lower = c_name.lower()
                        if ev_lower and (c_lower in ev_lower or any(word in ev_lower for word in c_lower.split() if len(word) > 4)):
                            matched_circuit = c_data
                            break

                if matched_circuit and "points" in matched_circuit:
                    coords = [TrackCoordinate(x=float(pt["x"]), y=float(pt["y"])) for pt in matched_circuit["points"]]
                    logger.info("Track map instantly loaded from circuits database: %s (%d points)", matched_circuit.get("name"), len(coords))
                    track_map = CircuitTrackMap(
                        event_name=matched_circuit.get("name", event_name),
                        year=season,
                        coordinates=coords,
                        total_points=len(coords),
                    )
                    self.db_cache.set_track_map(season, round_number, session_name, track_map.model_dump())
                    return track_map
        except Exception as e:
            logger.warning("Local circuits check failed: %s", e)

        session = fastf1.get_session(season, round_number, session_name)
        try:
            session.load(laps=False, telemetry=False, weather=False, messages=False)
            event_name = str(session.event.get("EventName", event_name))
        except Exception as e:
            logger.warning("Track map: session metadata load failed for S%s R%s: %s", season, round_number, e)

        # Get circuit rotation angle for correct visual orientation
        rotation_angle = 0.0
        corners_data = None
        try:
            circuit_info = session.get_circuit_info()
            rotation_angle = float(circuit_info.rotation) if circuit_info.rotation else 0.0
            corners_data = circuit_info.corners
            logger.info("Circuit rotation: %.1f degrees, %d corners", rotation_angle, len(corners_data) if corners_data is not None else 0)
        except Exception as e:
            logger.warning("Could not get circuit_info: %s", e)

        def rotate_coords(x_arr, y_arr, angle_deg):
            """Rotate coordinates by angle_deg degrees for correct track orientation."""
            if abs(angle_deg) < 0.01:
                return x_arr, y_arr
            theta = np.radians(angle_deg)
            c, s = np.cos(theta), np.sin(theta)
            x_rot = x_arr * c - y_arr * s
            y_rot = x_arr * s + y_arr * c
            return x_rot, y_rot

        # Parse official circuit corner positions if available
        parsed_corners: list[TrackCorner] = []
        if corners_data is not None and not corners_data.empty:
            try:
                xc_raw = corners_data["X"].values.astype(float)
                yc_raw = corners_data["Y"].values.astype(float)
                xc_rot, yc_rot = rotate_coords(xc_raw, yc_raw, rotation_angle)
                for idx, row in corners_data.reset_index().iterrows():
                    letter_val = str(row.get("Letter")) if pd.notna(row.get("Letter")) and row.get("Letter") else None
                    parsed_corners.append(
                        TrackCorner(
                            number=int(row["Number"]),
                            letter=letter_val,
                            x=float(xc_rot[idx]),
                            y=float(yc_rot[idx]),
                        )
                    )
            except Exception as e:
                logger.warning("Could not parse corners: %s", e)

        # Strategy 1: Extract from fastest lap position data (most accurate)
        try:
            laps_df = getattr(session, "_laps", None)
            if laps_df is not None and not laps_df.empty:
                fastest_lap = session.laps.pick_fastest()
                if fastest_lap is not None:
                    pos_data = fastest_lap.get_pos_data()
                    if pos_data is not None and "X" in pos_data.columns and "Y" in pos_data.columns:
                        x_raw = pos_data["X"].values.astype(float)
                        y_raw = pos_data["Y"].values.astype(float)

                        # Remove NaN values
                        valid = ~(np.isnan(x_raw) | np.isnan(y_raw))
                        x_raw = x_raw[valid]
                        y_raw = y_raw[valid]

                        if len(x_raw) > 10:
                            # Apply circuit rotation
                            x_rot, y_rot = rotate_coords(x_raw, y_raw, rotation_angle)

                            # Downsample to ~200 points for SVG
                            step = max(1, len(x_rot) // 200)
                            x_ds = x_rot[::step]
                            y_ds = y_rot[::step]

                            coords = [
                                TrackCoordinate(x=float(x_ds[i]), y=float(y_ds[i]))
                                for i in range(len(x_ds))
                            ]

                            logger.info("Track map extracted from pos_data: %d points (downsampled from %d)", len(coords), len(x_raw))
                            return CircuitTrackMap(
                                event_name=event_name,
                                year=season,
                                coordinates=coords,
                                corners=parsed_corners,
                                total_points=len(coords),
                            )
        except Exception as e:
            logger.warning("Track map: pos_data extraction failed: %s", e)

        # Strategy 2: Extract from telemetry X/Y columns
        try:
            laps_df = getattr(session, "_laps", None)
            if laps_df is not None and not laps_df.empty:
                fastest_lap = session.laps.pick_fastest()
                if fastest_lap is not None:
                    telemetry = fastest_lap.get_telemetry()
                    if telemetry is not None and "X" in telemetry.columns and "Y" in telemetry.columns:
                        x_raw = telemetry["X"].values.astype(float)
                        y_raw = telemetry["Y"].values.astype(float)

                        valid = ~(np.isnan(x_raw) | np.isnan(y_raw))
                        x_raw = x_raw[valid]
                        y_raw = y_raw[valid]

                        if len(x_raw) > 10:
                            x_rot, y_rot = rotate_coords(x_raw, y_raw, rotation_angle)
                            step = max(1, len(x_rot) // 200)
                            x_ds = x_rot[::step]
                            y_ds = y_rot[::step]

                            coords = [
                                TrackCoordinate(x=float(x_ds[i]), y=float(y_ds[i]))
                                for i in range(len(x_ds))
                            ]

                            logger.info("Track map extracted from telemetry: %d points", len(coords))
                            return CircuitTrackMap(
                                event_name=event_name,
                                year=season,
                                coordinates=coords,
                                corners=parsed_corners,
                                total_points=len(coords),
                            )
        except Exception as e:
            logger.warning("Track map: telemetry extraction failed: %s", e)

        # Strategy 3: Use corner coordinates from circuit_info as lightweight fallback
        if corners_data is not None and len(corners_data) > 2:
            try:
                x_corners = corners_data["X"].values.astype(float)
                y_corners = corners_data["Y"].values.astype(float)
                valid = ~(np.isnan(x_corners) | np.isnan(y_corners))
                x_corners = x_corners[valid]
                y_corners = y_corners[valid]

                if len(x_corners) > 2:
                    x_rot, y_rot = rotate_coords(x_corners, y_corners, rotation_angle)
                    coords = [
                        TrackCoordinate(x=float(x_rot[i]), y=float(y_rot[i]))
                        for i in range(len(x_rot))
                    ]
                    # Close the circuit loop
                    coords.append(coords[0])

                    logger.info("Track map from circuit corners: %d points", len(coords))
                    return CircuitTrackMap(
                        event_name=event_name,
                        year=season,
                        coordinates=coords,
                        total_points=len(coords),
                    )
            except Exception as e:
                logger.warning("Track map: corner extraction failed: %s", e)

        # Strategy 4: Fallback to pre-computed official circuits database
        try:
            circuits_path = Path(__file__).resolve().parent.parent / "data" / "circuits.json"
            if circuits_path.exists():
                with open(circuits_path, "r", encoding="utf-8") as f:
                    circuits_db = json.load(f)

                ev_lower = (event_name or "").lower()
                matched_circuit = None
                for c_name, c_data in circuits_db.items():
                    c_lower = c_name.lower()
                    if ev_lower and (c_lower in ev_lower or any(word in ev_lower for word in c_lower.split() if len(word) > 4)):
                        matched_circuit = c_data
                        break

                if not matched_circuit and "Bahrain International Circuit" in circuits_db:
                    matched_circuit = circuits_db["Bahrain International Circuit"]

                if matched_circuit and "points" in matched_circuit:
                    coords = [TrackCoordinate(x=float(pt["x"]), y=float(pt["y"])) for pt in matched_circuit["points"]]
                    logger.info("Track map loaded from local circuits database: %s (%d points)", matched_circuit.get("name"), len(coords))
                    return CircuitTrackMap(
                        event_name=matched_circuit.get("name", event_name),
                        year=season,
                        coordinates=coords,
                        total_points=len(coords),
                    )
        except Exception as e:
            logger.warning("Local circuits fallback failed: %s", e)

        logger.warning("Track map: all extraction strategies exhausted for S%s R%s", season, round_number)
        return None

    async def get_circuit_map(
        self, season: int, round_number: int, session_name: str
    ) -> CircuitTrackMap | None:
        """Fetch actual circuit layout coordinates off the main thread."""
        return await asyncio.to_thread(
            self._sync_get_track_map, season, round_number, session_name
        )

    def _sync_get_ghost_comparison(
        self, season: int, round_number: int, session_name: str, driver1: str, driver2: str
    ) -> GhostComparisonData:
        """Extract and compare head-to-head lap telemetry for Data Ghost."""
        # Check SQLite persistent cache first (<1ms)
        cached = self.db_cache.get_ghost_telemetry(season, round_number, session_name, driver1, driver2)
        if cached and isinstance(cached, dict):
            logger.info("Ghost comparison retrieved from SQLite cache (0ms): S%d R%d (%s vs %s)", season, round_number, driver1, driver2)
            return GhostComparisonData(**cached)

        session_key = (season, round_number, session_name)
        lock = _get_session_lock(session_key)
        with lock:
            if session_key in _session_cache:
                session = _session_cache[session_key]
            else:
                session = fastf1.get_session(season, round_number, session_name)
                _session_cache[session_key] = session

            try:
                if getattr(session, "_laps", None) is None or getattr(session, "car_data", None) is None:
                    session.load(laps=True, telemetry=True, weather=False, messages=False)
            except Exception as e:
                logger.warning("Could not load telemetry for ghost comparison: %s", e)

        def get_driver_info(drv_id: str) -> DriverInfo:
            try:
                if hasattr(session, "results") and session.results is not None and not session.results.empty:
                    res_match = session.results[session.results["DriverNumber"] == str(drv_id)]
                    if not res_match.empty:
                        row = res_match.iloc[0]
                        t_color = str(row.get("TeamColor", ""))
                        if not t_color or t_color == "nan":
                            t_color = "#3671C6" if drv_id == "1" else "#E8002D"
                        elif not t_color.startswith("#"):
                            t_color = f"#{t_color}"
                        return DriverInfo(
                            driver_number=str(drv_id),
                            broadcast_name=str(row.get("BroadcastName", f"Driver {drv_id}")),
                            full_name=str(row.get("FullName", f"Driver {drv_id}")),
                            abbreviation=str(row.get("Abbreviation", f"D{drv_id}")),
                            team_name=str(row.get("TeamName", "Formula 1 Team")),
                            team_color=t_color,
                        )
            except Exception:
                pass
            return DriverInfo(
                driver_number=str(drv_id),
                broadcast_name=f"Driver {drv_id}",
                full_name=f"Driver {drv_id}",
                abbreviation=f"D{drv_id}",
                team_name="Formula 1 Team",
                team_color="#3671C6" if drv_id == "1" else "#E8002D",
            )

        d1_info = get_driver_info(driver1)
        d2_info = get_driver_info(driver2)

        lap1 = None
        lap2 = None
        try:
            if hasattr(session, "laps") and session.laps is not None and not session.laps.empty:
                d1_laps = session.laps.pick_drivers([driver1])
                d2_laps = session.laps.pick_drivers([driver2])
                lap1 = d1_laps.pick_fastest() if not d1_laps.empty else None
                lap2 = d2_laps.pick_fastest() if not d2_laps.empty else None
        except Exception as e:
            logger.warning("Could not pick fastest laps for drivers: %s", e)

        lap1_str = format_timedelta(lap1.get("LapTime")) if lap1 is not None and pd.notna(lap1.get("LapTime")) else None
        lap2_str = format_timedelta(lap2.get("LapTime")) if lap2 is not None and pd.notna(lap2.get("LapTime")) else None
        lap1_num = int(lap1.get("LapNumber", 0)) if lap1 is not None and pd.notna(lap1.get("LapNumber")) else None
        lap2_num = int(lap2.get("LapNumber", 0)) if lap2 is not None and pd.notna(lap2.get("LapNumber")) else None

        points: list[GhostTelemetryPoint] = []
        delta_final = 0.0
        faster_code = d1_info.abbreviation

        if lap1 is not None and lap2 is not None:
            try:
                tel1 = lap1.get_car_data().add_distance()
                tel2 = lap2.get_car_data().add_distance()

                if tel1 is not None and tel2 is not None and not tel1.empty and not tel2.empty:
                    d_max = float(min(tel1["Distance"].max(), tel2["Distance"].max()))
                    num_samples = 240
                    d_grid = np.linspace(0, d_max, num=num_samples)

                    t1_sec = tel1["Time"].dt.total_seconds().values
                    t2_sec = tel2["Time"].dt.total_seconds().values
                    dist1 = tel1["Distance"].values
                    dist2 = tel2["Distance"].values

                    t1_interp = np.interp(d_grid, dist1, t1_sec)
                    t2_interp = np.interp(d_grid, dist2, t2_sec)
                    delta_interp = t1_interp - t2_interp

                    s1_interp = np.interp(d_grid, dist1, tel1["Speed"].values)
                    s2_interp = np.interp(d_grid, dist2, tel2["Speed"].values)

                    th1_interp = np.interp(d_grid, dist1, tel1["Throttle"].values)
                    th2_interp = np.interp(d_grid, dist2, tel2["Throttle"].values)

                    br1_interp = np.interp(d_grid, dist1, tel1["Brake"].astype(float).values)
                    br2_interp = np.interp(d_grid, dist2, tel2["Brake"].astype(float).values)

                    g1_interp = np.interp(d_grid, dist1, tel1["nGear"].values)
                    g2_interp = np.interp(d_grid, dist2, tel2["nGear"].values)

                    drs1_interp = np.interp(d_grid, dist1, tel1["DRS"].values)
                    drs2_interp = np.interp(d_grid, dist2, tel2["DRS"].values)

                    for i in range(num_samples):
                        points.append(
                            GhostTelemetryPoint(
                                distance=round(float(d_grid[i]), 1),
                                speed_1=round(float(s1_interp[i]), 1),
                                speed_2=round(float(s2_interp[i]), 1),
                                throttle_1=round(float(th1_interp[i]), 1),
                                throttle_2=round(float(th2_interp[i]), 1),
                                brake_1=round(float(br1_interp[i]), 2),
                                brake_2=round(float(br2_interp[i]), 2),
                                gear_1=int(round(float(g1_interp[i]))),
                                gear_2=int(round(float(g2_interp[i]))),
                                drs_1=1 if int(round(float(drs1_interp[i]))) in [10, 12, 14, 1] else 0,
                                drs_2=1 if int(round(float(drs2_interp[i]))) in [10, 12, 14, 1] else 0,
                                delta_time=round(float(delta_interp[i]), 4),
                            )
                        )

                    delta_final = round(float(delta_interp[-1]), 3)
                    faster_code = d1_info.abbreviation if delta_final <= 0 else d2_info.abbreviation
            except Exception as e:
                logger.error("Error computing ghost telemetry comparison: %s", e)

        comparison_data = GhostComparisonData(
            season=season,
            round_number=round_number,
            session_name=session_name,
            driver_1=d1_info,
            driver_2=d2_info,
            lap_time_1=lap1_str,
            lap_time_2=lap2_str,
            lap_number_1=lap1_num,
            lap_number_2=lap2_num,
            delta_final_seconds=delta_final,
            faster_driver=faster_code,
            telemetry_points=points,
        )

        if points:
            self.db_cache.set_ghost_telemetry(
                season, round_number, session_name, driver1, driver2, comparison_data.model_dump()
            )

        return comparison_data

    async def get_ghost_comparison(
        self, season: int, round_number: int, session_name: str, driver1: str, driver2: str
    ) -> GhostComparisonData:
        """Fetch head-to-head lap telemetry comparison off the main thread."""
        return await asyncio.to_thread(
            self._sync_get_ghost_comparison, season, round_number, session_name, driver1, driver2
        )

