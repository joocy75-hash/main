"""Phase 2: Reward engine - pending_rewards, user_attendance_logs, user_missions, user_spin_logs.

Revision ID: o5p6q7r8s9t0
Revises: n4o5p6q7r8s9
Create Date: 2026-02-20
"""
import sqlalchemy as sa
from alembic import op

revision = "o5p6q7r8s9t0"
down_revision = "n4o5p6q7r8s9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pending_rewards",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("reward_type", sa.String(10), nullable=False),
        sa.Column("source", sa.String(30), nullable=False, index=True),
        sa.Column("description", sa.String(200), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending", index=True),
        sa.Column("processed_by", sa.Integer(), sa.ForeignKey("admin_users.id"), nullable=True),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
        sa.Column("reject_reason", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "user_attendance_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("check_in_date", sa.Date(), nullable=False),
        sa.Column("day_number", sa.Integer(), nullable=False),
        sa.Column("reward_amount", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("reward_type", sa.String(10), nullable=False, server_default="cash"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "check_in_date", name="uq_user_attendance_date"),
    )

    op.create_table(
        "user_missions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("mission_id", sa.Integer(), sa.ForeignKey("missions.id"), nullable=False, index=True),
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(20), nullable=False, server_default="in_progress", index=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("claimed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "mission_id", name="uq_user_mission"),
    )

    op.create_table(
        "user_spin_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("spin_config_id", sa.Integer(), sa.ForeignKey("spin_configs.id"), nullable=False),
        sa.Column("spin_date", sa.Date(), nullable=False, index=True),
        sa.Column("prize_label", sa.String(50), nullable=False),
        sa.Column("prize_value", sa.Numeric(18, 2), nullable=False, server_default="0"),
        sa.Column("prize_type", sa.String(10), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("user_spin_logs")
    op.drop_table("user_missions")
    op.drop_table("user_attendance_logs")
    op.drop_table("pending_rewards")
