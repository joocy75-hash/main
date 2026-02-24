"""Pending reward management endpoints for admin approval/rejection."""

from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from pydantic import Field as PydanticField
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PermissionChecker
from app.database import get_session
from app.models.admin_user import AdminUser
from app.models.pending_reward import PendingReward
from app.models.user import User
from app.services import reward_engine

router = APIRouter(prefix="/rewards", tags=["rewards"])


# ─── Schemas ─────────────────────────────────────────────────────

class PendingRewardResponse(BaseModel):
    id: int
    user_id: int
    username: str | None = None
    amount: Decimal
    reward_type: str
    source: str
    description: str | None
    status: str
    processed_by: int | None
    processed_at: datetime | None
    reject_reason: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PendingRewardListResponse(BaseModel):
    items: list[PendingRewardResponse]
    total: int
    page: int
    page_size: int


class RewardActionRequest(BaseModel):
    reason: str | None = None


# ─── List Pending Rewards ───────────────────────────────────────

@router.get("/pending", response_model=PendingRewardListResponse)
async def list_pending_rewards(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    source: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("finance.view")),
):
    base = select(PendingReward)
    if status_filter:
        base = base.where(PendingReward.status == status_filter)
    if source:
        base = base.where(PendingReward.source == source)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar() or 0

    stmt = base.order_by(PendingReward.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size)
    results = (await session.execute(stmt)).scalars().all()

    items = []
    for r in results:
        user = await session.get(User, r.user_id)
        items.append(PendingRewardResponse(
            id=r.id,
            user_id=r.user_id,
            username=user.username if user else None,
            amount=r.amount,
            reward_type=r.reward_type,
            source=r.source,
            description=r.description,
            status=r.status,
            processed_by=r.processed_by,
            processed_at=r.processed_at,
            reject_reason=r.reject_reason,
            created_at=r.created_at,
        ))

    return PendingRewardListResponse(items=items, total=total, page=page, page_size=page_size)


# ─── Approve ────────────────────────────────────────────────────

@router.post("/{reward_id}/approve", response_model=PendingRewardResponse, status_code=200)
async def approve_reward(
    reward_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("finance.approve")),
):
    try:
        pending = await reward_engine.approve_pending_reward(session, reward_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await session.commit()
    await session.refresh(pending)

    user = await session.get(User, pending.user_id)
    return PendingRewardResponse(
        id=pending.id,
        user_id=pending.user_id,
        username=user.username if user else None,
        amount=pending.amount,
        reward_type=pending.reward_type,
        source=pending.source,
        description=pending.description,
        status=pending.status,
        processed_by=pending.processed_by,
        processed_at=pending.processed_at,
        reject_reason=pending.reject_reason,
        created_at=pending.created_at,
    )


# ─── Reject ─────────────────────────────────────────────────────

@router.post("/{reward_id}/reject", response_model=PendingRewardResponse, status_code=200)
async def reject_reward(
    reward_id: int,
    body: RewardActionRequest,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("finance.approve")),
):
    try:
        pending = await reward_engine.reject_pending_reward(
            session, reward_id, current_user.id, body.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await session.commit()
    await session.refresh(pending)

    user = await session.get(User, pending.user_id)
    return PendingRewardResponse(
        id=pending.id,
        user_id=pending.user_id,
        username=user.username if user else None,
        amount=pending.amount,
        reward_type=pending.reward_type,
        source=pending.source,
        description=pending.description,
        status=pending.status,
        processed_by=pending.processed_by,
        processed_at=pending.processed_at,
        reject_reason=pending.reject_reason,
        created_at=pending.created_at,
    )
