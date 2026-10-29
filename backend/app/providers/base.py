from abc import ABC, abstractmethod
from backend.app.schemas.f1 import (
    CircuitTrackMap,
    GrandPrixEvent,
    LapData,
    RaceDashboardData,
    SeasonInfo,
)


class F1DataProvider(ABC):
    """Abstract interface for Formula 1 data providers (FastF1, OpenF1, etc.)."""

    @abstractmethod
    async def get_seasons(self) -> list[SeasonInfo]:
        """Get list of supported seasons."""

    @abstractmethod
    async def get_events(self, season: int) -> list[GrandPrixEvent]:
        """Get Grand Prix schedule/events for a given season."""

    @abstractmethod
    async def get_session_dashboard(
        self, season: int, round_number: int, session_name: str
    ) -> RaceDashboardData:
        """Get full normalized session dashboard data (timing, classification, stints)."""

    @abstractmethod
    async def get_driver_laps(
        self, season: int, round_number: int, session_name: str, driver_identifier: str
    ) -> list[LapData]:
        """Get lap-by-lap timing and tyre info for a specific driver."""

    @abstractmethod
    async def get_circuit_map(
        self, season: int, round_number: int, session_name: str
    ) -> CircuitTrackMap | None:
        """Extract circuit coordinates from car telemetry."""
