from fastapi import APIRouter
from backend.app.api.v1 import events, seasons, sessions, strategy

api_router = APIRouter()

api_router.include_router(seasons.router)
api_router.include_router(events.router)
api_router.include_router(sessions.router)
api_router.include_router(strategy.router)
