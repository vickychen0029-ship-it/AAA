"""add ai interview scope columns

Revision ID: 0003_ai_interview_scope
Revises: 0002_ai_interview
Create Date: 2026-05-12 00:10:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0003_ai_interview_scope"
down_revision = "0002_ai_interview"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("ai_interview_sessions", sa.Column("scope_type", sa.String(length=16), nullable=False, server_default="full"))
    op.add_column("ai_interview_sessions", sa.Column("target_section", sa.String(length=16), nullable=True))


def downgrade() -> None:
    op.drop_column("ai_interview_sessions", "target_section")
    op.drop_column("ai_interview_sessions", "scope_type")
