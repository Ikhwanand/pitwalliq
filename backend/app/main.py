from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1.router import api_router
from backend.app.core.config import settings

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("pitwalliq")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan event handler for startup and shutdown procedures."""
    logger.info("Initializing PitwallIQ Backend API (Version %s)", settings.VERSION)
    if settings.FASTF1_CACHE_ENABLED:
        settings.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        logger.info("FastF1 cache verified at %s", settings.CACHE_DIR)
    yield
    logger.info("Shutting down PitwallIQ Backend API")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Basic health check endpoint."""
    return {"status": "healthy", "service": settings.PROJECT_NAME, "version": settings.VERSION}


@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    """Root endpoint welcoming developers."""
    return {
        "message": "Welcome to PitwallIQ API — Your AI Race Strategist",
        "docs": f"{settings.API_V1_STR}/docs",
    }
