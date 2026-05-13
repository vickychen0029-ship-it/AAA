from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ChartBase(BaseModel):
    chart_type: str = Field(min_length=1, max_length=32)
    chart_payload: dict[str, Any]


class ChartCreate(ChartBase):
    profile_id: str


class ChartRead(ChartBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    profile_id: str
    calculated_at: datetime


class NatalChartGeo(BaseModel):
    lat: float
    lng: float


class NatalChartCreateRequest(BaseModel):
    profile_id: str = Field(min_length=1, max_length=36)
    birth_utc_dt: datetime
    geo: NatalChartGeo
    house_system: str = Field(default="P", min_length=1, max_length=1)


class NatalChartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    profile_id: str
    chart_type: str
    chart_payload: dict[str, Any]
    calculated_at: datetime
