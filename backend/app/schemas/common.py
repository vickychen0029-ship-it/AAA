from __future__ import annotations

from datetime import date, datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class APIErrorResponse(BaseModel):
    code: str
    message: str
    details: Any | None = None


class HealthResponse(BaseModel):
    status: str
    app: str


class PaginationMeta(BaseModel):
    page: int = 1
    page_size: int = 20
    total: int = 0


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    meta: PaginationMeta


class TimestampedSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class BirthInfo(BaseModel):
    birth_date: date | None = None
    birth_hour: int | None = None
    birth_minute: int | None = None
