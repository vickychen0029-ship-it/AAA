from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import Date, ForeignKey, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, IdMixin, TimestampMixin


class Daily(IdMixin, TimestampMixin, Base):
    __tablename__ = "dailies"
    __table_args__ = (UniqueConstraint("profile_id", "day", name="uq_dailies_profile_day"),)

    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    day: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    profile: Mapped["Profile"] = relationship(back_populates="dailies")
