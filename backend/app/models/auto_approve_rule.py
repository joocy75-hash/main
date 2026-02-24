from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Field, SQLModel


class AutoApproveRule(SQLModel, table=True):
    __tablename__ = "auto_approve_rules"

    id: int | None = Field(default=None, primary_key=True)
    type: str = Field(max_length=20, index=True)  # deposit, withdrawal
    condition_type: str = Field(max_length=30)  # amount_under, user_level_above, user_rank_in
    condition_value: str = Field(max_length=200)  # threshold amount, level number, or comma-separated ranks
    max_amount: Decimal = Field(default=Decimal("0"), max_digits=18, decimal_places=2)
    is_active: bool = Field(default=True)
    created_by: int | None = Field(default=None, foreign_key="admin_users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
