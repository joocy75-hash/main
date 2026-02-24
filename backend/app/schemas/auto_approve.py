from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class AutoApproveRuleCreate(BaseModel):
    type: str = Field(pattern=r"^(deposit|withdrawal)$")
    condition_type: str = Field(pattern=r"^(amount_under|user_level_above|user_rank_in)$")
    condition_value: str = Field(min_length=1, max_length=200)
    max_amount: Decimal = Field(default=Decimal("0"), ge=0)
    is_active: bool = True


class AutoApproveRuleUpdate(BaseModel):
    condition_type: str | None = Field(default=None, pattern=r"^(amount_under|user_level_above|user_rank_in)$")
    condition_value: str | None = Field(default=None, min_length=1, max_length=200)
    max_amount: Decimal | None = Field(default=None, ge=0)
    is_active: bool | None = None


class AutoApproveRuleResponse(BaseModel):
    id: int
    type: str
    condition_type: str
    condition_value: str
    max_amount: Decimal
    is_active: bool
    created_by: int | None
    created_at: datetime
    updated_at: datetime


class AutoApproveRuleListResponse(BaseModel):
    items: list[AutoApproveRuleResponse]
    total: int
