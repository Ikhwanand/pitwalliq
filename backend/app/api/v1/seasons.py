from fastapi import APIRouter, Depends
from backend.app.schemas.common import StandardResponse
from backend.app.schemas.f1 import SeasonInfo
from backend.app.services.f1_service import F1Service, get_f1_service

router = APIRouter(prefix="/seasons", tags=["Seasons"])


@router.get("", response_model=StandardResponse[list[SeasonInfo]])
async def list_seasons(service: F1Service = Depends(get_f1_service)) -> StandardResponse[list[SeasonInfo]]:
    """Retrieve list of supported F1 seasons."""
    seasons = await service.list_seasons()
    return StandardResponse(data=seasons, message="Seasons retrieved successfully")
