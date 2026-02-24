"""Payback config management + payback calculation endpoints."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from pydantic import Field as PydanticField
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PermissionChecker
from app.database import get_session
from app.models.admin_user import AdminUser
from app.models.bet_record import BetRecord
from app.models.money_log import MoneyLog
from app.models.payback_config import PaybackConfig
from app.models.user import User
from app.services import reward_engine

router = APIRouter(prefix="/payback", tags=["payback"])


# ─── Schemas ─────────────────────────────────────────────────────────

class PaybackConfigCreate(BaseModel):
    name: str = PydanticField(max_length=100)
    payback_percent: Decimal = PydanticField(ge=0, le=100)
    payback_type: str = PydanticField(default="cash", pattern=r"^(cash|bonus|point)$")
    period: str = PydanticField(default="daily", pattern=r"^(daily|weekly|monthly)$")
    min_loss_amount: Decimal = PydanticField(default=Decimal("0"), ge=0)
    max_payback_amount: Decimal = PydanticField(default=Decimal("0"), ge=0)
    is_active: bool = True


class PaybackConfigUpdate(BaseModel):
    name: str | None = PydanticField(default=None, max_length=100)
    payback_percent: Decimal | None = PydanticField(default=None, ge=0, le=100)
    payback_type: str | None = PydanticField(default=None, pattern=r"^(cash|bonus|point)$")
    period: str | None = PydanticField(default=None, pattern=r"^(daily|weekly|monthly)$")
    min_loss_amount: Decimal | None = PydanticField(default=None, ge=0)
    max_payback_amount: Decimal | None = PydanticField(default=None, ge=0)
    is_active: bool | None = None


class PaybackConfigResponse(BaseModel):
    id: int
    name: str
    payback_percent: Decimal
    payback_type: str
    period: str
    min_loss_amount: Decimal
    max_payback_amount: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaybackConfigListResponse(BaseModel):
    items: list[PaybackConfigResponse]
    total: int
    page: int
    page_size: int


# ─── List Configs ────────────────────────────────────────────────────

@router.get("/configs", response_model=PaybackConfigListResponse)
async def list_payback_configs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    period: str | None = Query(None),
    is_active: bool | None = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("payback.view")),
):
    base = select(PaybackConfig)
    if period is not None:
        base = base.where(PaybackConfig.period == period)
    if is_active is not None:
        base = base.where(PaybackConfig.is_active == is_active)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar() or 0

    stmt = base.order_by(PaybackConfig.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size)
    result = await session.execute(stmt)
    configs = result.scalars().all()

    items = [PaybackConfigResponse.model_validate(c) for c in configs]
    return PaybackConfigListResponse(items=items, total=total, page=page, page_size=page_size)


# ─── Get Config ──────────────────────────────────────────────────────

@router.get("/configs/{config_id}", response_model=PaybackConfigResponse)
async def get_payback_config(
    config_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("payback.view")),
):
    config = await session.get(PaybackConfig, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Payback config not found")

    return PaybackConfigResponse.model_validate(config)


# ─── Create Config ───────────────────────────────────────────────────

@router.post("/configs", response_model=PaybackConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_payback_config(
    body: PaybackConfigCreate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("payback.manage")),
):
    config = PaybackConfig(
        name=body.name,
        payback_percent=body.payback_percent,
        payback_type=body.payback_type,
        period=body.period,
        min_loss_amount=body.min_loss_amount,
        max_payback_amount=body.max_payback_amount,
        is_active=body.is_active,
    )
    session.add(config)
    await session.commit()
    await session.refresh(config)

    return PaybackConfigResponse.model_validate(config)


# ─── Update Config ───────────────────────────────────────────────────

@router.put("/configs/{config_id}", response_model=PaybackConfigResponse)
async def update_payback_config(
    config_id: int,
    body: PaybackConfigUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("payback.manage")),
):
    config = await session.get(PaybackConfig, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Payback config not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    config.updated_at = datetime.now(timezone.utc)

    session.add(config)
    await session.commit()
    await session.refresh(config)

    return PaybackConfigResponse.model_validate(config)


# ─── Payback Calculation ────────────────────────────────────────────

class PaybackCalculateRequest(BaseModel):
    user_id: int
    period: str = PydanticField(default="daily", pattern=r"^(daily|weekly|monthly)$")


class PaybackCalculateResponse(BaseModel):
    user_id: int
    period: str
    total_bet: Decimal
    total_win: Decimal
    net_loss: Decimal
    payback_percent: Decimal
    payback_amount: Decimal
    reward_status: str  # "granted", "pending", "none", "no_loss"


@router.post("/calculate", response_model=PaybackCalculateResponse, status_code=200)
async def calculate_payback(
    body: PaybackCalculateRequest,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("payback.manage")),
):
    user = await session.get(User, body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get active payback config for this period
    config_stmt = select(PaybackConfig).where(
        and_(PaybackConfig.period == body.period, PaybackConfig.is_active == True)
    ).order_by(PaybackConfig.id)
    config = (await session.execute(config_stmt)).scalar_first()
    if not config:
        raise HTTPException(status_code=400, detail=f"활성화된 {body.period} 페이백 설정이 없습니다")

    # Determine time range
    now = datetime.now(timezone.utc)
    if body.period == "daily":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif body.period == "weekly":
        start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Check duplicate: already paid this period?
    dup_stmt = select(MoneyLog).where(
        and_(
            MoneyLog.user_id == body.user_id,
            MoneyLog.type == "payback_reward",
            MoneyLog.created_at >= start,
        )
    )
    if (await session.execute(dup_stmt)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 이번 기간에 페이백이 지급되었습니다")

    # Calculate net loss from BetRecord within the period
    bet_sum_stmt = select(
        func.coalesce(func.sum(BetRecord.bet_amount), Decimal("0")),
        func.coalesce(func.sum(BetRecord.win_amount), Decimal("0")),
    ).where(
        and_(
            BetRecord.user_id == body.user_id,
            BetRecord.bet_at >= start,
        )
    )
    bet_row = (await session.execute(bet_sum_stmt)).one()
    total_bet = bet_row[0]
    total_win = bet_row[1]
    net_loss = total_bet - total_win

    # No loss = no payback
    if net_loss <= 0:
        return PaybackCalculateResponse(
            user_id=body.user_id, period=body.period,
            total_bet=total_bet, total_win=total_win, net_loss=Decimal("0"),
            payback_percent=config.payback_percent, payback_amount=Decimal("0"),
            reward_status="no_loss",
        )

    # Check minimum loss threshold
    if net_loss < config.min_loss_amount:
        return PaybackCalculateResponse(
            user_id=body.user_id, period=body.period,
            total_bet=total_bet, total_win=total_win, net_loss=net_loss,
            payback_percent=config.payback_percent, payback_amount=Decimal("0"),
            reward_status="none",
        )

    # Calculate payback amount with cap
    payback_amount = net_loss * config.payback_percent / Decimal("100")
    if config.max_payback_amount > 0:
        payback_amount = min(payback_amount, config.max_payback_amount)
    payback_amount = payback_amount.quantize(Decimal("0.01"))

    # Grant via reward engine
    reward_status = "none"
    if payback_amount > 0:
        result = await reward_engine.grant_reward(
            session, body.user_id, payback_amount, config.payback_type,
            "payback", f"{body.period} 페이백 ({config.payback_percent}%)",
        )
        reward_status = result.status

    await session.commit()
    return PaybackCalculateResponse(
        user_id=body.user_id, period=body.period,
        total_bet=total_bet, total_win=total_win, net_loss=net_loss,
        payback_percent=config.payback_percent, payback_amount=payback_amount,
        reward_status=reward_status,
    )
