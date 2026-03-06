"""Analytics & bulk operation schemas."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field

# ─── RTP ────────────────────────────────────────────────────────

class RtpByGameResponse(BaseModel):
    game_id: int
    game_name: str
    total_bet: Decimal
    total_win: Decimal
    rtp_percentage: Decimal
    bet_count: int


class RtpByProviderResponse(BaseModel):
    provider_id: int
    provider_name: str
    total_bet: Decimal
    total_win: Decimal
    rtp_percentage: Decimal
    bet_count: int


class RtpTrendResponse(BaseModel):
    date: date
    total_bet: Decimal
    total_win: Decimal
    rtp_percentage: Decimal


# ─── Bulk Operations ────────────────────────────────────────────

class BulkStatusUpdate(BaseModel):
    user_ids: list[int]
    new_status: str = Field(max_length=20)
    reason: str = Field(max_length=500)


class BulkMessageSend(BaseModel):
    user_ids: list[int]
    title: str = Field(max_length=200)
    content: str


ALLOWED_POINT_TYPES = {
    "admin_adjustment", "admin_grant", "admin_revoke",
    "event_reward", "attendance", "mission", "spin",
    "payback", "promotion", "referral",
}


class BulkPointGrant(BaseModel):
    user_ids: list[int] = Field(max_length=500)
    amount: Decimal = Field(max_digits=18, decimal_places=2)
    type: str = Field(max_length=30, pattern=r"^[a-z_]+$")
    reason: str = Field(max_length=500)


class BulkOperationResult(BaseModel):
    success_count: int
    fail_count: int
    errors: list[str] | None = None
