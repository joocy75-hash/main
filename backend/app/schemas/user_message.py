from datetime import datetime

from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    id: int
    sender_type: str
    sender_id: int
    receiver_type: str
    receiver_id: int
    title: str
    content: str
    is_read: bool
    read_at: datetime | None
    created_at: datetime


class MessageListResponse(BaseModel):
    items: list[MessageResponse]
    total: int
    page: int
    page_size: int


class MessageCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)


class BulkMessageCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    target: str = Field(pattern=r"^(all|by_status|by_rank|by_ids)$")
    target_value: str | None = None


class BulkMessageResponse(BaseModel):
    sent_count: int
    target: str
    target_value: str | None
