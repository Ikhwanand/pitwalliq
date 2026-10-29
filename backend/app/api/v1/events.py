from fastapi import APIRouter, Depends, Query
from backend.app.schemas.common import StandardResponse
from backend.app.schemas.f1 import GrandPrixEvent
from backend.app.services.f1_service import F1Service, get_f1_service

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=StandardResponse[list[GrandPrixEvent]])
async def list_events(
    season: int = Query(..., description="Season year, e.g. 2024", ge=2018),
    service: F1Service = Depends(get_f1_service),
) -> StandardResponse[list[GrandPrixEvent]]:
    """Retrieve all Grand Prix events/schedule for a given season."""
    events = await service.list_events(season)
    return StandardResponse(
        data=events,
        message=f"Retrieved {len(events)} events for season {season}",
    )
