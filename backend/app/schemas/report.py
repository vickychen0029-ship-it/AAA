from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ReportBase(BaseModel):
    report_type: str = Field(min_length=1, max_length=32)
    input_payload: dict[str, Any] | None = None
    result_payload: dict[str, Any]
    status: str = Field(default="completed", max_length=16)


class ReportCreate(ReportBase):
    profile_id: str
    chart_id: str | None = None


class ReportRead(ReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    profile_id: str
    chart_id: str | None


class NatalReportCreateRequest(BaseModel):
    profile_id: str = Field(min_length=1, max_length=36)
    chart_id: str | None = Field(default=None, min_length=1, max_length=36)
    mode: Literal["concise", "standard"] = "standard"
    chart_payload: dict[str, Any] | None = None


class NatalReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    profile_id: str
    chart_id: str | None
    report_type: str
    input_payload: dict[str, Any] | None
    result_payload: dict[str, Any]
    status: str
