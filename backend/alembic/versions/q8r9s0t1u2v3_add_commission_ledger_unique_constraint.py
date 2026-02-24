"""Add UNIQUE constraint to commission_ledger for idempotency.

Revision ID: q8r9s0t1u2v3
Revises: fb092089737f
Create Date: 2026-02-25 00:30:00.000000
"""
from alembic import op

revision = "q8r9s0t1u2v3"
down_revision = "fb092089737f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_commission_ledger_ref_user_type",
        "commission_ledger",
        ["reference_id", "user_id", "type"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_commission_ledger_ref_user_type",
        "commission_ledger",
        type_="unique",
    )
