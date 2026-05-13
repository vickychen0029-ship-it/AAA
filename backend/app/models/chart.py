from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, IdMixin, TimestampMixin


class Chart(IdMixin, TimestampMixin, Base):
    __tablename__ = "charts"

    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    chart_type: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    chart_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    profile: Mapped["Profile"] = relationship(back_populates="charts")
    reports: Mapped[list["Report"]] = relationship(back_populates="chart")
