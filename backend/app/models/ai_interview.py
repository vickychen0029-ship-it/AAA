from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, IdMixin, TimestampMixin


class AIInterviewSession(IdMixin, TimestampMixin, Base):
    __tablename__ = "ai_interview_sessions"

    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("profiles.id", ondelete="CASCADE"), index=True, nullable=False
    )
    system_type: Mapped[str] = mapped_column(String(32), index=True, nullable=False, default="bazi")
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="in_progress")
    scope_type: Mapped[str] = mapped_column(String(16), nullable=False, default="full")
    target_section: Mapped[str | None] = mapped_column(String(16), nullable=True)
    current_section_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_question_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    question_plan: Mapped[dict[str, list[str]]] = mapped_column(JSON, nullable=False)
    answers: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    bazi_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    final_summary: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    profile: Mapped["Profile"] = relationship(back_populates="ai_interview_sessions")
