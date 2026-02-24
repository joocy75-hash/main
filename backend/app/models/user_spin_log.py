import datetime as dt
from datetime import timezone
from decimal import Decimal

from sqlmodel import Field, SQLModel


class UserSpinLog(SQLModel, table=True):
    __tablename__ = "user_spin_logs"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    spin_config_id: int = Field(foreign_key="spin_configs.id")
    spin_date: dt.date = Field(index=True)
    prize_label: str = Field(max_length=50)
    prize_value: Decimal = Field(default=Decimal("0"), max_digits=18, decimal_places=2)
    prize_type: str = Field(max_length=10)  # cash, bonus, point, nothing
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(timezone.utc))
