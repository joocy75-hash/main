"""Auto-approve rule engine for deposits/withdrawals."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auto_approve_rule import AutoApproveRule
from app.models.user import User


async def check_auto_approve(
    session: AsyncSession,
    tx_type: str,
    user_id: int,
    amount: Decimal,
) -> bool:
    """Check if a transaction should be auto-approved based on active rules."""
    stmt = select(AutoApproveRule).where(
        AutoApproveRule.type == tx_type,
        AutoApproveRule.is_active == True,  # noqa: E712
    )
    result = await session.execute(stmt)
    rules = result.scalars().all()

    if not rules:
        return False

    user = await session.get(User, user_id)
    if not user:
        return False

    for rule in rules:
        if _matches_rule(rule, user, amount):
            return True

    return False


def _matches_rule(rule: AutoApproveRule, user: User, amount: Decimal) -> bool:
    """Check if a single rule matches the transaction."""
    # Guard: max_amount is required for matching; reject if None or exceeded
    if rule.max_amount is None or amount > rule.max_amount:
        return False

    if rule.condition_type == "amount_under":
        threshold = Decimal(rule.condition_value)
        return amount <= threshold

    if rule.condition_type == "user_level_above":
        min_level = int(rule.condition_value)
        return (user.level or 0) >= min_level

    if rule.condition_type == "user_rank_in":
        allowed_ranks = [r.strip() for r in rule.condition_value.split(",")]
        return (user.rank or "") in allowed_ranks

    return False
