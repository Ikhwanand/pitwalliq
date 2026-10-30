from datetime import datetime
from pydantic import BaseModel, Field


class SeasonInfo(BaseModel):
    year: int
    total_rounds: int | None = None


class EventSessionSummary(BaseModel):
    name: str
    session_type: str  # FP1, FP2, FP3, Qualifying, Sprint, Race
    date: datetime | None = None


class GrandPrixEvent(BaseModel):
    round_number: int
    country: str
    location: str
    official_event_name: str
    event_date: datetime | None = None
    event_name: str
    sessions: list[EventSessionSummary] = Field(default_factory=list)


class DriverInfo(BaseModel):
    driver_number: str
    broadcast_name: str
    full_name: str
    abbreviation: str
    team_name: str
    team_color: str | None = None


class TyreStint(BaseModel):
    stint_number: int
    compound: str  # SOFT, MEDIUM, HARD, INTERMEDIATE, WET
    start_lap: int
    end_lap: int
    total_laps: int
    is_new_tyre: bool | None = None


class LapData(BaseModel):
    lap_number: int
    driver_number: str
    lap_time_seconds: float | None = None
    lap_time_str: str | None = None
    sector1_seconds: float | None = None
    sector2_seconds: float | None = None
    sector3_seconds: float | None = None
    compound: str | None = None
    tyre_age: int | None = None
    is_accurate: bool = True
    position: int | None = None


class DriverClassification(BaseModel):
    position: int
    driver: DriverInfo
    status: str  # Finished, DNF, etc.
    points: float = 0.0
    laps_completed: int = 0
    fastest_lap_time: str | None = None
    stints: list[TyreStint] = Field(default_factory=list)


class TrackCoordinate(BaseModel):
    x: float
    y: float


class TrackCorner(BaseModel):
    number: int
    letter: str | None = None
    x: float
    y: float


class CircuitTrackMap(BaseModel):
    event_name: str
    year: int
    coordinates: list[TrackCoordinate] = Field(default_factory=list)
    corners: list[TrackCorner] = Field(default_factory=list)
    total_points: int = 0


class RaceDashboardData(BaseModel):
    season: int
    round_number: int
    event_name: str
    session_name: str
    total_laps: int
    classification: list[DriverClassification] = Field(default_factory=list)
    track_map: CircuitTrackMap | None = None


class GhostTelemetryPoint(BaseModel):
    distance: float
    speed_1: float
    speed_2: float
    throttle_1: float
    throttle_2: float
    brake_1: float
    brake_2: float
    gear_1: int
    gear_2: int
    drs_1: int
    drs_2: int
    delta_time: float


class GhostComparisonData(BaseModel):
    season: int
    round_number: int
    session_name: str
    driver_1: DriverInfo
    driver_2: DriverInfo
    lap_time_1: str | None = None
    lap_time_2: str | None = None
    lap_number_1: int | None = None
    lap_number_2: int | None = None
    delta_final_seconds: float = 0.0
    faster_driver: str = ""
    telemetry_points: list[GhostTelemetryPoint] = Field(default_factory=list)

