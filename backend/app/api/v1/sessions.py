from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.schemas.common import StandardResponse
from backend.app.schemas.f1 import CircuitTrackMap, LapData, RaceDashboardData
from backend.app.services.f1_service import F1Service, get_f1_service

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.get("/dashboard", response_model=StandardResponse[RaceDashboardData])
async def get_session_dashboard(
    season: int = Query(..., ge=2018),
    round_number: int = Query(..., ge=1, le=25),
    session_name: str = Query(..., description="Session identifier: 'Race', 'Qualifying', 'FP1', etc."),
    service: F1Service = Depends(get_f1_service),
) -> StandardResponse[RaceDashboardData]:
    """Retrieve full normalized race dashboard data (timing, classification, stints, and track map)."""
    try:
        data = await service.get_dashboard(season, round_number, session_name)
        return StandardResponse(
            data=data,
            message=f"Retrieved dashboard for {data.event_name} {season} ({session_name})",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load session data for Season {season} Round {round_number}: {str(e)}",
        )


@router.get("/driver-laps", response_model=StandardResponse[list[LapData]])
async def get_driver_laps(
    season: int = Query(..., ge=2018),
    round_number: int = Query(..., ge=1, le=25),
    session_name: str = Query(...),
    driver_number: str = Query(..., description="Driver number or 3-letter code (e.g. '1' or 'VER')"),
    service: F1Service = Depends(get_f1_service),
) -> StandardResponse[list[LapData]]:
    """Retrieve lap-by-lap timing, sector times, tyre compound, and tyre age for a driver."""
    try:
        laps = await service.get_driver_laps(season, round_number, session_name, driver_number)
        return StandardResponse(
            data=laps,
            message=f"Retrieved {len(laps)} laps for driver {driver_number}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load laps for driver {driver_number}: {str(e)}",
        )


@router.get("/track-map", response_model=StandardResponse[CircuitTrackMap | None])
async def get_track_map(
    season: int = Query(..., ge=2018),
    round_number: int = Query(..., ge=1, le=25),
    session_name: str = Query(default="Race"),
    service: F1Service = Depends(get_f1_service),
) -> StandardResponse[CircuitTrackMap | None]:
    """Retrieve circuit layout coordinates extracted from car telemetry."""
    try:
        track_map = await service.get_track_map(season, round_number, session_name)
        return StandardResponse(
            data=track_map,
            message="Circuit track map coordinates retrieved successfully",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate circuit map: {str(e)}",
        )
