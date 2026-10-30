import logging
from backend.app.providers.base import F1DataProvider
from backend.app.providers.fastf1_provider import FastF1Provider
from backend.app.schemas.f1 import (
    CircuitTrackMap,
    GhostComparisonData,
    GrandPrixEvent,
    LapData,
    RaceDashboardData,
    SeasonInfo,
)

logger = logging.getLogger(__name__)


class F1Service:
    """Service layer for Formula 1 data retrieval and telemetry analytics."""

    def __init__(self, provider: F1DataProvider | None = None) -> None:
        self.provider = provider or FastF1Provider()

    async def list_seasons(self) -> list[SeasonInfo]:
        return await self.provider.get_seasons()

    async def list_events(self, season: int) -> list[GrandPrixEvent]:
        return await self.provider.get_events(season)

    async def get_dashboard(
        self, season: int, round_number: int, session_name: str
    ) -> RaceDashboardData:
        return await self.provider.get_session_dashboard(
            season, round_number, session_name
        )

    async def get_driver_laps(
        self, season: int, round_number: int, session_name: str, driver_identifier: str
    ) -> list[LapData]:
        return await self.provider.get_driver_laps(
            season, round_number, session_name, driver_identifier
        )

    async def get_track_map(
        self, season: int, round_number: int, session_name: str
    ) -> CircuitTrackMap | None:
        return await self.provider.get_circuit_map(
            season, round_number, session_name
        )

    async def get_ghost_comparison(
        self, season: int, round_number: int, session_name: str, driver1: str, driver2: str
    ) -> GhostComparisonData:
        return await self.provider.get_ghost_comparison(
            season, round_number, session_name, driver1, driver2
        )



_default_service: F1Service | None = None


def get_f1_service() -> F1Service:
    """FastAPI Dependency injection provider for F1Service."""
    global _default_service
    if _default_service is None:
        _default_service = F1Service()
    return _default_service
