from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class UserMission(SQLModel, table=True):
    __tablename__ = "user_missions"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    mission_id: int = Field(foreign_key="missions.id", index=True)
    progress: int = Field(default=0)
    status: str = Field(default="in_progress", max_length=20, index=True)  # in_progress, completed, claimed
    completed_at: datetime | None = Field(default=None)
    claimed_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
