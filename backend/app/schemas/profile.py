from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ProfileBase(BaseModel):
    nickname: str = Field(min_length=1, max_length=128)
    gender: str | None = Field(default=None, max_length=16)
    birth_date: date | None = None
    birth_hour: int | None = Field(default=None, ge=0, le=23)
    birth_minute: int | None = Field(default=None, ge=0, le=59)
    birth_place: str | None = Field(default=None, max_length=255)
    current_place: str | None = Field(default=None, max_length=255)
    dst_mode: str = Field(default="auto", max_length=16)
    is_dst: bool = False
    geo: dict[str, Any] | None = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    nickname: str | None = Field(default=None, min_length=1, max_length=128)
    gender: str | None = Field(default=None, max_length=16)
    birth_date: date | None = None
    birth_hour: int | None = Field(default=None, ge=0, le=23)
    birth_minute: int | None = Field(default=None, ge=0, le=59)
    birth_place: str | None = Field(default=None, max_length=255)
    current_place: str | None = Field(default=None, max_length=255)
    dst_mode: str | None = Field(default=None, max_length=16)
    is_dst: bool | None = None
    geo: dict[str, Any] | None = None


class ProfileRead(ProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None


class ProfileCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    gender: str | None = Field(default=None, max_length=16)
    location_query: str = Field(min_length=1, max_length=255)
    current_place: str | None = Field(default=None, max_length=255)
    birth_local_dt: datetime
    dst_auto: bool = True
    dst_applied: bool | None = None
    iana_tz: str | None = None
    lat: float | None = None
    lng: float | None = None


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=128)
    gender: str | None = Field(default=None, max_length=16)
    location_query: str | None = Field(default=None, min_length=1, max_length=255)
    current_place: str | None = Field(default=None, max_length=255)
    birth_local_dt: datetime | None = None
    dst_auto: bool | None = None
    dst_applied: bool | None = None
    iana_tz: str | None = None
    lat: float | None = None
    lng: float | None = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    gender: str | None = None
    location_query: str
    current_place: str | None = None
    iana_tz: str
    lat: float
    lng: float
    birth_local_dt: datetime
    birth_utc_dt: datetime
    dst_auto: bool
    dst_applied: bool


class ProfileListResponse(BaseModel):
    items: list[ProfileResponse]
    limit: int
    total: int
