from datetime import datetime, timezone
from enum import Enum
from typing import Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class DataFreshness(str, Enum):
    HISTORICAL = "historical"
    DELAYED = "delayed"
    LIVE = "live"
    UNKNOWN = "unknown"


class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: str | None = None
    freshness: DataFreshness = DataFreshness.HISTORICAL
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
