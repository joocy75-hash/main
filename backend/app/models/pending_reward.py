from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Field, SQLModel


class PendingReward(SQLModel, table=True):
    __tablename__ = "pending_rewards"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    amount: Decimal = Field(max_digits=18, decimal_places=2)
    reward_type: str = Field(max_length=10)  # point, cash, bonus
    source: str = Field(max_length=30, index=True)  # attendance, mission, spin, payback, promotion
    description: str | None = Field(default=None, max_length=200)
    status: str = Field(default="pending", max_length=20, index=True)  # pending, approved, rejected
    processed_by: int | None = Field(default=None, foreign_key="admin_users.id")
    processed_at: datetime | None = Field(default=None)
    reject_reason: str | None = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
