"""require profiles.user_id

Revision ID: 0004_profiles_user_required
Revises: 0003_ai_interview_scope
Create Date: 2026-05-13 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0004_profiles_user_required"
down_revision = "0003_ai_interview_scope"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT COUNT(1) FROM profiles WHERE user_id IS NULL")).scalar_one()
    if rows and rows > 0:
        raise RuntimeError("profiles.user_id contains NULL; please bind legacy profiles before migration")

    with op.batch_alter_table("profiles") as batch_op:
        batch_op.alter_column("user_id", existing_type=sa.String(length=36), nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("profiles") as batch_op:
        batch_op.alter_column("user_id", existing_type=sa.String(length=36), nullable=True)
