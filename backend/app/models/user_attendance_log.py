import datetime as dt
from datetime import timezone
from decimal import Decimal

from sqlmodel import Field, SQLModel


class UserAttendanceLog(SQLModel, table=True):
    __tablename__ = "user_attendance_logs"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    check_in_date: dt.date
    day_number: int
    reward_amount: Decimal = Field(default=Decimal("0"), max_digits=18, decimal_places=2)
    reward_type: str = Field(default="cash", max_length=10)
    created_at: dt.datetime = Field(default_factory=lambda: dt.datetime.now(timezone.utc))
