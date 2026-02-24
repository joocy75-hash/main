"""Unified reward granting engine with hybrid threshold-based auto-approval."""

from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.money_log import MoneyLog
from app.models.pending_reward import PendingReward
from app.models.point_log import PointLog
from app.models.user import User
from app.services.message_service import send_system_message

# Default auto-approve thresholds
POINT_AUTO_THRESHOLD = Decimal("50000")
CASH_AUTO_THRESHOLD = Decimal("100000")

UNIT_MAP = {"point": "P", "cash": "원", "bonus": "원"}
SOURCE_LABEL = {
    "attendance": "출석 체크",
    "mission": "미션 완료",
    "spin": "룰렛 보상",
    "payback": "페이백",
    "promotion": "프로모션 보너스",
}


@dataclass
class RewardResult:
    status: str  # "granted" or "pending"
    amount: Decimal
    reward_type: str
    pending_id: int | None = None


async def grant_reward(
    session: AsyncSession,
    user_id: int,
    amount: Decimal,
    reward_type: str,
    source: str,
    description: str,
    auto_approve_threshold: Decimal | None = None,
) -> RewardResult:
    if amount <= 0:
        raise ValueError("Amount must be positive")

    # Determine threshold
    if auto_approve_threshold is not None:
        threshold = auto_approve_threshold
    elif reward_type == "point":
        threshold = POINT_AUTO_THRESHOLD
    else:
        threshold = CASH_AUTO_THRESHOLD

    needs_approval = amount > threshold

    if needs_approval:
        pending = PendingReward(
            user_id=user_id,
            amount=amount,
            reward_type=reward_type,
            source=source,
            description=description,
        )
        session.add(pending)
        await session.flush()

        # Notify user about pending reward
        label = SOURCE_LABEL.get(source, source)
        unit = UNIT_MAP.get(reward_type, "")
        await send_system_message(
            session, user_id, "reward_pending",
            label=label, amount=amount, unit=unit,
        )

        return RewardResult(status="pending", amount=amount, reward_type=reward_type, pending_id=pending.id)

    # Auto-grant: lock user row
    user = await _lock_user(session, user_id)
    await _apply_reward(session, user, amount, reward_type, source, description)

    return RewardResult(status="granted", amount=amount, reward_type=reward_type)


async def approve_pending_reward(
    session: AsyncSession,
    pending_id: int,
    admin_id: int,
) -> PendingReward:
    stmt = select(PendingReward).where(PendingReward.id == pending_id).with_for_update()
    pending = (await session.execute(stmt)).scalar_one_or_none()
    if not pending:
        raise ValueError("Pending reward not found")
    if pending.status != "pending":
        raise ValueError(f"Cannot approve: status is {pending.status}")

    user = await _lock_user(session, pending.user_id)
    await _apply_reward(
        session, user, pending.amount, pending.reward_type,
        pending.source, pending.description or "",
    )

    pending.status = "approved"
    pending.processed_by = admin_id
    pending.processed_at = datetime.now(timezone.utc)
    session.add(pending)
    return pending


async def reject_pending_reward(
    session: AsyncSession,
    pending_id: int,
    admin_id: int,
    reason: str | None = None,
) -> PendingReward:
    stmt = select(PendingReward).where(PendingReward.id == pending_id).with_for_update()
    pending = (await session.execute(stmt)).scalar_one_or_none()
    if not pending:
        raise ValueError("Pending reward not found")
    if pending.status != "pending":
        raise ValueError(f"Cannot reject: status is {pending.status}")

    pending.status = "rejected"
    pending.processed_by = admin_id
    pending.processed_at = datetime.now(timezone.utc)
    pending.reject_reason = reason
    session.add(pending)

    # Notify user
    label = SOURCE_LABEL.get(pending.source, pending.source)
    unit = UNIT_MAP.get(pending.reward_type, "")
    await send_system_message(
        session, pending.user_id, "reward_rejected",
        label=label, amount=pending.amount, unit=unit, reason=reason,
    )
    return pending


async def _lock_user(session: AsyncSession, user_id: int) -> User:
    stmt = select(User).where(User.id == user_id).with_for_update()
    user = (await session.execute(stmt)).scalar_one_or_none()
    if not user:
        raise ValueError("User not found")
    return user


async def _apply_reward(
    session: AsyncSession,
    user: User,
    amount: Decimal,
    reward_type: str,
    source: str,
    description: str,
) -> None:
    unit = UNIT_MAP.get(reward_type, "")
    label = SOURCE_LABEL.get(source, source)

    if reward_type == "point":
        before = user.points
        user.points += amount
        session.add(PointLog(
            user_id=user.id,
            type=f"{source}_reward",
            amount=amount,
            balance_before=before,
            balance_after=user.points,
            description=description,
            reference_type=source,
        ))
    else:
        before = user.balance
        user.balance += amount
        session.add(MoneyLog(
            user_id=user.id,
            type=f"{source}_reward",
            amount=amount,
            balance_before=before,
            balance_after=user.balance,
            description=description,
            reference_type=source,
        ))

    user.updated_at = datetime.now(timezone.utc)
    session.add(user)

    # Send notification message
    await send_system_message(
        session, user.id, "reward_granted",
        label=label, amount=amount, unit=unit, description=description,
    )
