"""Attendance config management + check-in execution endpoints."""

import datetime as dt
from datetime import datetime, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from pydantic import Field as PydanticField
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PermissionChecker
from app.database import get_session
from app.models.admin_user import AdminUser
from app.models.attendance_config import AttendanceConfig
from app.models.user import User
from app.models.user_attendance_log import UserAttendanceLog
from app.services import reward_engine

router = APIRouter(prefix="/attendance", tags=["attendance"])


# ─── Schemas ─────────────────────────────────────────────────────────

class AttendanceConfigCreate(BaseModel):
    day_number: int = PydanticField(ge=1, le=30)
    reward_amount: Decimal = PydanticField(ge=0)
    reward_type: str = PydanticField(pattern=r"^(cash|bonus|point)$")
    is_active: bool = True


class AttendanceConfigUpdate(BaseModel):
    day_number: int | None = PydanticField(default=None, ge=1, le=30)
    reward_amount: Decimal | None = PydanticField(default=None, ge=0)
    reward_type: str | None = PydanticField(default=None, pattern=r"^(cash|bonus|point)$")
    is_active: bool | None = None


class AttendanceConfigResponse(BaseModel):
    id: int
    day_number: int
    reward_amount: Decimal
    reward_type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AttendanceConfigListResponse(BaseModel):
    items: list[AttendanceConfigResponse]
    total: int
    page: int
    page_size: int


# ─── List Configs ────────────────────────────────────────────────────

@router.get("/configs", response_model=AttendanceConfigListResponse)
async def list_attendance_configs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("attendance.view")),
):
    base = select(AttendanceConfig)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar() or 0

    stmt = base.order_by(AttendanceConfig.day_number).offset(
        (page - 1) * page_size
    ).limit(page_size)
    result = await session.execute(stmt)
    configs = result.scalars().all()

    items = [AttendanceConfigResponse.model_validate(c) for c in configs]
    return AttendanceConfigListResponse(items=items, total=total, page=page, page_size=page_size)


# ─── Get Config ──────────────────────────────────────────────────────

@router.get("/configs/{config_id}", response_model=AttendanceConfigResponse)
async def get_attendance_config(
    config_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("attendance.view")),
):
    config = await session.get(AttendanceConfig, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Attendance config not found")

    return AttendanceConfigResponse.model_validate(config)


# ─── Check-In (Reward Execution) ────────────────────────────────────

class CheckInRequest(BaseModel):
    user_id: int


class CheckInResponse(BaseModel):
    user_id: int
    check_in_date: dt.date
    day_number: int
    reward_amount: Decimal
    reward_type: str
    reward_status: str  # "granted" or "pending"


@router.post("/check-in", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED)
async def attendance_check_in(
    body: CheckInRequest,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("attendance.manage")),
):
    # Lock user row to prevent race condition
    user_stmt = select(User).where(User.id == body.user_id).with_for_update()
    user = (await session.execute(user_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    today = datetime.now(ZoneInfo("Asia/Seoul")).date()

    # Duplicate check (re-check after lock)
    dup_stmt = select(UserAttendanceLog).where(
        and_(UserAttendanceLog.user_id == body.user_id, UserAttendanceLog.check_in_date == today)
    )
    if (await session.execute(dup_stmt)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="이미 오늘 출석 처리되었습니다")

    # Calculate consecutive days
    yesterday = today - dt.timedelta(days=1)
    prev_stmt = select(UserAttendanceLog).where(
        and_(UserAttendanceLog.user_id == body.user_id, UserAttendanceLog.check_in_date == yesterday)
    )
    prev_log = (await session.execute(prev_stmt)).scalar_one_or_none()
    day_number = (prev_log.day_number % 30) + 1 if prev_log else 1

    # Get reward config for this day
    config_stmt = select(AttendanceConfig).where(
        and_(AttendanceConfig.day_number == day_number, AttendanceConfig.is_active == True)
    )
    config = (await session.execute(config_stmt)).scalar_one_or_none()

    reward_amount = config.reward_amount if config else Decimal("0")
    reward_type = config.reward_type if config else "cash"

    # Record attendance
    log = UserAttendanceLog(
        user_id=body.user_id,
        check_in_date=today,
        day_number=day_number,
        reward_amount=reward_amount,
        reward_type=reward_type,
    )
    session.add(log)

    # Grant reward via engine
    reward_status = "granted"
    if reward_amount > 0:
        result = await reward_engine.grant_reward(
            session, body.user_id, reward_amount, reward_type,
            "attendance", f"출석 {day_number}일차 보상",
        )
        reward_status = result.status

    await session.commit()
    return CheckInResponse(
        user_id=body.user_id,
        check_in_date=today,
        day_number=day_number,
        reward_amount=reward_amount,
        reward_type=reward_type,
        reward_status=reward_status,
    )


# ─── Create Config ───────────────────────────────────────────────────

@router.post("/configs", response_model=AttendanceConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_attendance_config(
    body: AttendanceConfigCreate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("attendance.manage")),
):
    existing_stmt = select(AttendanceConfig).where(AttendanceConfig.day_number == body.day_number)
    if (await session.execute(existing_stmt)).scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Day {body.day_number} config already exists")

    config = AttendanceConfig(
        day_number=body.day_number,
        reward_amount=body.reward_amount,
        reward_type=body.reward_type,
        is_active=body.is_active,
    )
    session.add(config)
    await session.commit()
    await session.refresh(config)

    return AttendanceConfigResponse.model_validate(config)


# ─── Update Config ───────────────────────────────────────────────────

@router.put("/configs/{config_id}", response_model=AttendanceConfigResponse)
async def update_attendance_config(
    config_id: int,
    body: AttendanceConfigUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("attendance.manage")),
):
    config = await session.get(AttendanceConfig, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Attendance config not found")

    update_data = body.model_dump(exclude_unset=True)

    if "day_number" in update_data and update_data["day_number"] != config.day_number:
        dup_stmt = select(AttendanceConfig).where(
            AttendanceConfig.day_number == update_data["day_number"],
            AttendanceConfig.id != config_id,
        )
        if (await session.execute(dup_stmt)).scalar_one_or_none():
            raise HTTPException(status_code=409, detail=f"Day {update_data['day_number']} config already exists")

    for field, value in update_data.items():
        setattr(config, field, value)
    config.updated_at = datetime.now(timezone.utc)

    session.add(config)
    await session.commit()
    await session.refresh(config)

    return AttendanceConfigResponse.model_validate(config)
