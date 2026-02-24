"""Phase 1: Bidirectional operations - add force_logout_at to users.

Revision ID: n4o5p6q7r8s9
Revises: m3n4o5p6q7r8
Create Date: 2026-02-20
"""
import sqlalchemy as sa
from alembic import op

revision = "n4o5p6q7r8s9"
down_revision = "m3n4o5p6q7r8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("force_logout_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "force_logout_at")
