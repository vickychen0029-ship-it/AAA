"""initial schema

Revision ID: 0001_init
Revises:
Create Date: 2026-05-11 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=64), nullable=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_superuser", sa.Boolean(), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
        sa.UniqueConstraint("username", name=op.f("uq_users_username")),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=False)

    op.create_table(
        "contents",
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("content_type", sa.String(length=32), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_contents_user_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_contents")),
        sa.UniqueConstraint("slug", name=op.f("uq_contents_slug")),
    )
    op.create_index(op.f("ix_contents_user_id"), "contents", ["user_id"], unique=False)

    op.create_table(
        "profiles",
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("nickname", sa.String(length=128), nullable=False),
        sa.Column("gender", sa.String(length=16), nullable=True),
        sa.Column("iana_tz", sa.String(length=64), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("birth_local_dt", sa.DateTime(timezone=False), nullable=True),
        sa.Column("birth_utc_dt", sa.DateTime(timezone=True), nullable=True),
        sa.Column("dst_auto", sa.Boolean(), nullable=False),
        sa.Column("dst_applied", sa.Boolean(), nullable=False),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("birth_hour", sa.Integer(), nullable=True),
        sa.Column("birth_minute", sa.Integer(), nullable=True),
        sa.Column("birth_place", sa.String(length=255), nullable=True),
        sa.Column("current_place", sa.String(length=255), nullable=True),
        sa.Column("dst_mode", sa.String(length=16), nullable=False),
        sa.Column("is_dst", sa.Boolean(), nullable=False),
        sa.Column("geo", sa.JSON(), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_profiles_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_profiles")),
    )
    op.create_index(op.f("ix_profiles_user_id"), "profiles", ["user_id"], unique=False)

    op.create_table(
        "charts",
        sa.Column("profile_id", sa.String(length=36), nullable=False),
        sa.Column("chart_type", sa.String(length=32), nullable=False),
        sa.Column("chart_payload", sa.JSON(), nullable=False),
        sa.Column("calculated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"], name=op.f("fk_charts_profile_id_profiles"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_charts")),
    )
    op.create_index(op.f("ix_charts_chart_type"), "charts", ["chart_type"], unique=False)
    op.create_index(op.f("ix_charts_profile_id"), "charts", ["profile_id"], unique=False)

    op.create_table(
        "dailies",
        sa.Column("profile_id", sa.String(length=36), nullable=False),
        sa.Column("day", sa.Date(), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"], name=op.f("fk_dailies_profile_id_profiles"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_dailies")),
        sa.UniqueConstraint("profile_id", "day", name="uq_dailies_profile_day"),
    )
    op.create_index(op.f("ix_dailies_day"), "dailies", ["day"], unique=False)
    op.create_index(op.f("ix_dailies_profile_id"), "dailies", ["profile_id"], unique=False)

    op.create_table(
        "reports",
        sa.Column("profile_id", sa.String(length=36), nullable=False),
        sa.Column("chart_id", sa.String(length=36), nullable=True),
        sa.Column("report_type", sa.String(length=32), nullable=False),
        sa.Column("input_payload", sa.JSON(), nullable=True),
        sa.Column("result_payload", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["chart_id"], ["charts.id"], name=op.f("fk_reports_chart_id_charts"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"], name=op.f("fk_reports_profile_id_profiles"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reports")),
    )
    op.create_index(op.f("ix_reports_chart_id"), "reports", ["chart_id"], unique=False)
    op.create_index(op.f("ix_reports_profile_id"), "reports", ["profile_id"], unique=False)
    op.create_index(op.f("ix_reports_report_type"), "reports", ["report_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_reports_report_type"), table_name="reports")
    op.drop_index(op.f("ix_reports_profile_id"), table_name="reports")
    op.drop_index(op.f("ix_reports_chart_id"), table_name="reports")
    op.drop_table("reports")

    op.drop_index(op.f("ix_dailies_profile_id"), table_name="dailies")
    op.drop_index(op.f("ix_dailies_day"), table_name="dailies")
    op.drop_table("dailies")

    op.drop_index(op.f("ix_charts_profile_id"), table_name="charts")
    op.drop_index(op.f("ix_charts_chart_type"), table_name="charts")
    op.drop_table("charts")

    op.drop_index(op.f("ix_profiles_user_id"), table_name="profiles")
    op.drop_table("profiles")

    op.drop_index(op.f("ix_contents_user_id"), table_name="contents")
    op.drop_table("contents")

    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
