from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class UserMemo(SQLModel, table=True):
    __tablename__ = "user_memos"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    content: str
    admin_user_id: int = Field(foreign_key="admin_users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
