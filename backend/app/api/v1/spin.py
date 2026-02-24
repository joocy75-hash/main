"""Spin config management + spin execution endpoints."""

import datetime as dt_mod
import random
from datetime import datetime, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, field_validator
from pydantic import Field as PydanticField
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PermissionChecker
from app.database import get_session
from app.models.admin_user import AdminUser
from app.models.spin_config import SpinConfig
from app.models.user import User
from app.models.user_spin_log import UserSpinLog
from app.services import reward_engine

router = APIRouter(prefix="/spin", tags=["spin"])


# ─── Schemas ─────────────────────────────────────────────────────────

class SpinPrize(BaseModel):
    label: str = PydanticField(max_length=50)
    value: int | float = PydanticField(ge=0)
    type: str = PydanticField(pattern=r"^(cash|bonus|point|nothing)$")
    probability: int | float = PydanticField(ge=0, le=100)


def _validate_prizes(prizes: list[SpinPrize]) -> list[SpinPrize]:
    if len(prizes) < 2:
        raise ValueError("At least 2 prizes required")
    total_prob = sum(p.probability for p in prizes)
    if abs(total_prob - 100) > 0.01:
        raise ValueError(f"Prize probabilities must sum to 100 (got {total_prob})")
    return prizes


class SpinConfigCreate(BaseModel):
    name: str = PydanticField(max_length=100)
    prizes: list[SpinPrize] = PydanticField(default=[
        {"label": "꽝", "value": 0, "type": "nothing", "probability": 70},
        {"label": "보너스", "value": 1000, "type": "bonus", "probability": 30},
    ])
    max_spins_daily: int = PydanticField(default=1, ge=1)
    is_active: bool = True

    @field_validator("prizes")
    @classmethod
    def check_prizes(cls, v: list[SpinPrize]) -> list[SpinPrize]:
        return _validate_prizes(v)


class SpinConfigUpdate(BaseModel):
    name: str | None = PydanticField(default=None, max_length=100)
    prizes: list[SpinPrize] | None = None
    max_spins_daily: int | None = PydanticField(default=None, ge=1)
    is_active: bool | None = None

    @field_validator("prizes")
    @classmethod
    def check_prizes(cls, v: list[SpinPrize] | None) -> list[SpinPrize] | None:
        if v is not None:
            return _validate_prizes(v)
        return v


class SpinConfigResponse(BaseModel):
    id: int
    name: str
    prizes: list[dict]
    max_spins_daily: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SpinConfigListResponse(BaseModel):
    items: list[SpinConfigResponse]
    total: int
    page: int
    page_size: int


# ─── List Configs ────────────────────────────────────────────────────

@router.get("/configs", response_model=SpinConfigListResponse)
async def list_spin_configs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("spin.view")),
):
    base = select(SpinConfig)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar() or 0

    stmt = base.order_by(SpinConfig.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size)
    result = await session.execute(stmt)
    configs = result.scalars().all()

    items = [SpinConfigResponse.model_validate(c) for c in configs]
    return SpinConfigListResponse(items=items, total=total, page=page, page_size=page_size)


# ─── Get Config ──────────────────────────────────────────────────────

@router.get("/configs/{config_id}", response_model=SpinConfigResponse)
async def get_spin_config(
    config_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("spin.view")),
):
    config = await session.get(SpinConfig, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Spin config not found")

    return SpinConfigResponse.model_validate(config)


# ─── Create Config ───────────────────────────────────────────────────

@router.post("/configs", response_model=SpinConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_spin_config(
    body: SpinConfigCreate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("spin.manage")),
):
    config = SpinConfig(
        name=body.name,
        prizes=[p.model_dump() for p in body.prizes],
        max_spins_daily=body.max_spins_daily,
        is_active=body.is_active,
    )
    session.add(config)
    await session.commit()
    await session.refresh(config)

    return SpinConfigResponse.model_validate(config)


# ─── Update Config ───────────────────────────────────────────────────

@router.put("/configs/{config_id}", response_model=SpinConfigResponse)
async def update_spin_config(
    config_id: int,
    body: SpinConfigUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("spin.manage")),
):
    config = await session.get(SpinConfig, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Spin config not found")

    update_data = body.model_dump(exclude_unset=True)
    if "prizes" in update_data and update_data["prizes"] is not None:
        update_data["prizes"] = [p if isinstance(p, dict) else p.model_dump() for p in update_data["prizes"]]
    for field, value in update_data.items():
        setattr(config, field, value)
    config.updated_at = datetime.now(timezone.utc)

    session.add(config)
    await session.commit()
    await session.refresh(config)

    return SpinConfigResponse.model_validate(config)


# ─── Spin Execution ─────────────────────────────────────────────────

class SpinExecuteRequest(BaseModel):
    user_id: int


class SpinExecuteResponse(BaseModel):
    user_id: int
    prize_label: str
    prize_value: Decimal
    prize_type: str
    reward_status: str  # "granted", "pending", or "none"


@router.post("/execute", response_model=SpinExecuteResponse, status_code=200)
async def execute_spin(
    body: SpinExecuteRequest,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("spin.manage")),
):
    # Lock user row to prevent race condition
    user_stmt = select(User).where(User.id == body.user_id).with_for_update()
    user = (await session.execute(user_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get first active spin config
    config_stmt = select(SpinConfig).where(SpinConfig.is_active == True).order_by(SpinConfig.id)
    config = (await session.execute(config_stmt)).scalar_first()
    if not config:
        raise HTTPException(status_code=400, detail="활성화된 룰렛 설정이 없습니다")

    today = datetime.now(ZoneInfo("Asia/Seoul")).date()

    # Check daily spin limit (re-check after lock)
    spin_count_stmt = select(func.count()).select_from(UserSpinLog).where(
        and_(
            UserSpinLog.user_id == body.user_id,
            UserSpinLog.spin_config_id == config.id,
            UserSpinLog.spin_date == today,
        )
    )
    spin_count = (await session.execute(spin_count_stmt)).scalar() or 0
    if spin_count >= config.max_spins_daily:
        raise HTTPException(status_code=400, detail=f"일일 스핀 한도({config.max_spins_daily}회)를 초과했습니다")

    # Weighted random pick
    prizes = config.prizes
    if not prizes:
        raise HTTPException(status_code=400, detail="룰렛 상품이 설정되지 않았습니다")

    weights = [p.get("probability", 0) for p in prizes]
    picked = random.choices(prizes, weights=weights, k=1)[0]

    prize_label = picked.get("label", "")
    prize_value = Decimal(str(picked.get("value", 0)))
    prize_type = picked.get("type", "nothing")

    # Record spin
    spin_log = UserSpinLog(
        user_id=body.user_id,
        spin_config_id=config.id,
        spin_date=today,
        prize_label=prize_label,
        prize_value=prize_value,
        prize_type=prize_type,
    )
    session.add(spin_log)

    # Grant reward if not "nothing"
    reward_status = "none"
    if prize_type != "nothing" and prize_value > 0:
        result = await reward_engine.grant_reward(
            session, body.user_id, prize_value, prize_type,
            "spin", f"룰렛 당첨: {prize_label}",
        )
        reward_status = result.status

    await session.commit()
    return SpinExecuteResponse(
        user_id=body.user_id,
        prize_label=prize_label,
        prize_value=prize_value,
        prize_type=prize_type,
        reward_status=reward_status,
    )
