from __future__ import annotations

from typing import Any

from sqlalchemy import ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, IdMixin, TimestampMixin


class Report(IdMixin, TimestampMixin, Base):
    __tablename__ = "reports"

    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    chart_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("charts.id", ondelete="SET NULL"), index=True, nullable=True
    )
    report_type: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    input_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    result_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="completed", nullable=False)

    profile: Mapped["Profile"] = relationship(back_populates="reports")
    chart: Mapped["Chart | None"] = relationship(back_populates="reports")
