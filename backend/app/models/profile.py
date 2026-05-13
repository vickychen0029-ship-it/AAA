from __future__ import annotations

from datetime import date, datetime
from typing import Any

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, IdMixin, TimestampMixin


class Profile(IdMixin, TimestampMixin, Base):
    __tablename__ = "profiles"

    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=True
    )
    nickname: Mapped[str] = mapped_column(String(128), nullable=False)
    gender: Mapped[str | None] = mapped_column(String(16), nullable=True)
    iana_tz: Mapped[str | None] = mapped_column(String(64), nullable=True)
    latitude: Mapped[float | None] = mapped_column(nullable=True)
    longitude: Mapped[float | None] = mapped_column(nullable=True)
    birth_local_dt: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    birth_utc_dt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    dst_auto: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    dst_applied: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    birth_hour: Mapped[int | None] = mapped_column(Integer, nullable=True)
    birth_minute: Mapped[int | None] = mapped_column(Integer, nullable=True)
    birth_place: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_place: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dst_mode: Mapped[str] = mapped_column(String(16), default="auto", nullable=False)
    is_dst: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    geo: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    user: Mapped["User | None"] = relationship(back_populates="profiles")
    charts: Mapped[list["Chart"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    dailies: Mapped[list["Daily"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    ai_interview_sessions: Mapped[list["AIInterviewSession"]] = relationship(
        back_populates="profile",
        cascade="all, delete-orphan",
    )
