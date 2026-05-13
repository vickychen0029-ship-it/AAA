"""add ai interview sessions

Revision ID: 0002_ai_interview
Revises: 0001_init
Create Date: 2026-05-12 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0002_ai_interview"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_interview_sessions",
        sa.Column("profile_id", sa.String(length=36), nullable=False),
        sa.Column("system_type", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("current_section_index", sa.Integer(), nullable=False),
        sa.Column("current_question_index", sa.Integer(), nullable=False),
        sa.Column("question_plan", sa.JSON(), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("bazi_payload", sa.JSON(), nullable=True),
        sa.Column("final_summary", sa.JSON(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"], name=op.f("fk_ai_interview_sessions_profile_id_profiles"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_interview_sessions")),
    )
    op.create_index(op.f("ix_ai_interview_sessions_profile_id"), "ai_interview_sessions", ["profile_id"], unique=False)
    op.create_index(op.f("ix_ai_interview_sessions_system_type"), "ai_interview_sessions", ["system_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_interview_sessions_system_type"), table_name="ai_interview_sessions")
    op.drop_index(op.f("ix_ai_interview_sessions_profile_id"), table_name="ai_interview_sessions")
    op.drop_table("ai_interview_sessions")
