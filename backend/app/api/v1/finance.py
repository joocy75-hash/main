"""Finance/Transaction management endpoints."""

from datetime import datetime, time as time_type, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PermissionChecker
from app.database import get_session
from app.models.admin_user import AdminUser
from app.models.auto_approve_rule import AutoApproveRule
from app.models.point_log import PointLog
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.auto_approve import (
    AutoApproveRuleCreate,
    AutoApproveRuleListResponse,
    AutoApproveRuleResponse,
    AutoApproveRuleUpdate,
)
from app.schemas.transaction import (
    AdjustmentCreate,
    DepositCreate,
    TransactionAction,
    TransactionListResponse,
    TransactionResponse,
    TransactionSummary,
    WithdrawalCreate,
)
from app.schemas.user import PointAdjustmentCreate
from app.services import notification_service
from app.services.message_service import send_system_message
from app.utils.events import publish_event
from app.services.auto_approve_service import check_auto_approve
from app.services.transaction_service import (
    approve_transaction,
    create_adjustment,
    create_deposit,
    create_withdrawal,
    reject_transaction,
)

SYSTEM_ADMIN_USERNAME = "system"

router = APIRouter(prefix="/finance", tags=["finance"])


async def _get_system_admin_id(session: AsyncSession) -> int | None:
    """Fetch the system admin user ID for auto-approve audit trail."""
    result = await session.execute(
        select(AdminUser).where(AdminUser.username == SYSTEM_ADMIN_USERNAME).limit(1)
    )
    system_admin = result.scalar_one_or_none()
    return system_admin.id if system_admin else None


async def _build_response(session: AsyncSession, tx: Transaction) -> TransactionResponse:
    user = await session.get(User, tx.user_id)
    processor = await session.get(AdminUser, tx.processed_by) if tx.processed_by else None
    return TransactionResponse(
        id=tx.id,
        uuid=str(tx.uuid),
        user_id=tx.user_id,
        user_username=user.username if user else None,
        type=tx.type,
        action=tx.action,
        amount=tx.amount,
        balance_before=tx.balance_before,
        balance_after=tx.balance_after,
        status=tx.status,
        coin_type=tx.coin_type,
        network=tx.network,
        tx_hash=tx.tx_hash,
        wallet_address=tx.wallet_address,
        confirmations=tx.confirmations,
        reference_type=tx.reference_type,
        reference_id=tx.reference_id,
        memo=tx.memo,
        processed_by=tx.processed_by,
        processed_by_username=processor.username if processor else None,
        processed_at=tx.processed_at,
        created_at=tx.created_at,
    )


async def _batch_build_responses(
    session: AsyncSession, transactions: list[Transaction],
) -> list[TransactionResponse]:
    """Batch-load users and processors to avoid N+1 queries."""
    if not transactions:
        return []
    user_ids = list({t.user_id for t in transactions})
    processor_ids = list({t.processed_by for t in transactions if t.processed_by})

    users_result = await session.execute(select(User).where(User.id.in_(user_ids)))
    users_map = {u.id: u for u in users_result.scalars().all()}

    processors_map: dict[int, AdminUser] = {}
    if processor_ids:
        proc_result = await session.execute(select(AdminUser).where(AdminUser.id.in_(processor_ids)))
        processors_map = {p.id: p for p in proc_result.scalars().all()}

    items = []
    for tx in transactions:
        user = users_map.get(tx.user_id)
        processor = processors_map.get(tx.processed_by) if tx.processed_by else None
        items.append(TransactionResponse(
            id=tx.id,
            uuid=str(tx.uuid),
            user_id=tx.user_id,
            user_username=user.username if user else None,
            type=tx.type,
            action=tx.action,
            amount=tx.amount,
            balance_before=tx.balance_before,
            balance_after=tx.balance_after,
            status=tx.status,
            coin_type=tx.coin_type,
            network=tx.network,
            tx_hash=tx.tx_hash,
            wallet_address=tx.wallet_address,
            confirmations=tx.confirmations,
            reference_type=tx.reference_type,
            reference_id=tx.reference_id,
            memo=tx.memo,
            processed_by=tx.processed_by,
            processed_by_username=processor.username if processor else None,
            processed_at=tx.processed_at,
            created_at=tx.created_at,
        ))
    return items


# ─── List Transactions ─────────────────────────────────────────────

@router.get("/transactions", response_model=TransactionListResponse)
async def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    type_filter: str | None = Query(None, alias="type"),
    status_filter: str | None = Query(None, alias="status"),
    user_id: int | None = Query(None),
    start_date: str | None = Query(None, description="YYYY-MM-DD"),
    end_date: str | None = Query(None, description="YYYY-MM-DD"),
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.view")),
):
    base = select(Transaction)
    if type_filter:
        base = base.where(Transaction.type == type_filter)
    if status_filter:
        base = base.where(Transaction.status == status_filter)
    if user_id:
        base = base.where(Transaction.user_id == user_id)
    if start_date:
        start_dt = datetime.combine(
            datetime.strptime(start_date, "%Y-%m-%d").date(),
            time_type.min,
            tzinfo=timezone.utc,
        )
        base = base.where(Transaction.created_at >= start_dt)
    if end_date:
        end_dt = datetime.combine(
            datetime.strptime(end_date, "%Y-%m-%d").date(),
            time_type.max,
            tzinfo=timezone.utc,
        )
        base = base.where(Transaction.created_at <= end_dt)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar() or 0

    sum_stmt = select(func.coalesce(func.sum(Transaction.amount), 0)).select_from(base.subquery())
    total_amount = (await session.execute(sum_stmt)).scalar()

    stmt = base.order_by(Transaction.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size)
    result = await session.execute(stmt)
    transactions = result.scalars().all()

    items = await _batch_build_responses(session, list(transactions))
    return TransactionListResponse(
        items=items, total=total, page=page, page_size=page_size, total_amount=total_amount,
    )


# ─── Summary ────────────────────────────────────────────────────────
# NOTE: Fixed path must be registered BEFORE {tx_id} to avoid "summary" being captured as tx_id

@router.get("/transactions/summary", response_model=list[TransactionSummary])
async def transaction_summary(
    user_id: int | None = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.view")),
):
    base = select(
        Transaction.type,
        Transaction.status,
        func.count().label("count"),
        func.coalesce(func.sum(Transaction.amount), 0).label("total_amount"),
    ).group_by(Transaction.type, Transaction.status)

    if user_id:
        base = base.where(Transaction.user_id == user_id)

    result = await session.execute(base)
    return [
        TransactionSummary(type=r.type, status=r.status, count=r.count, total_amount=r.total_amount)
        for r in result.all()
    ]


# ─── Get One ────────────────────────────────────────────────────────

@router.get("/transactions/{tx_id}", response_model=TransactionResponse)
async def get_transaction(
    tx_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.view")),
):
    tx = await session.get(Transaction, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return await _build_response(session, tx)


# ─── Deposit ────────────────────────────────────────────────────────

@router.post("/deposit", response_model=TransactionResponse, status_code=201)
async def request_deposit(
    body: DepositCreate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.create")),
):
    try:
        tx = await create_deposit(
            session, body.user_id, body.amount, body.memo,
            coin_type=body.coin_type, network=body.network,
            tx_hash=body.tx_hash, wallet_address=body.wallet_address,
        )
        user = await session.get(User, body.user_id)
        coin = body.coin_type or "USDT"

        # Auto-approve check before first commit
        auto_approved = False
        if tx.status == "pending" and await check_auto_approve(session, "deposit", body.user_id, body.amount):
            system_admin_id = await _get_system_admin_id(session)
            tx = await approve_transaction(session, tx.id, system_admin_id)
            tx.memo = (tx.memo or "") + " [시스템 자동승인]"
            notification_service.notify_transaction_approved("deposit", user.username, tx.amount, coin)
            await send_system_message(session, tx.user_id, "deposit_approved", amount=tx.amount, coin_type=coin)
            auto_approved = True

        await session.commit()
        await session.refresh(tx)
        resp = await _build_response(session, tx)

        await publish_event("new_deposit", {
            "user_id": body.user_id, "amount": str(body.amount), "username": user.username,
        })
        notification_service.notify_deposit_request(user.username, body.amount, coin)
        if not auto_approved:
            notification_service.notify_large_transaction("deposit", user.username, body.amount, coin)

        return resp
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Withdrawal ─────────────────────────────────────────────────────

@router.post("/withdrawal", response_model=TransactionResponse, status_code=201)
async def request_withdrawal(
    body: WithdrawalCreate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.create")),
):
    try:
        tx = await create_withdrawal(
            session, body.user_id, body.amount, body.memo,
            coin_type=body.coin_type, network=body.network,
            wallet_address=body.wallet_address,
        )
        user = await session.get(User, body.user_id)
        coin = body.coin_type or "USDT"

        # Auto-approve check before first commit
        auto_approved = False
        if tx.status == "pending" and await check_auto_approve(session, "withdrawal", body.user_id, body.amount):
            system_admin_id = await _get_system_admin_id(session)
            tx = await approve_transaction(session, tx.id, system_admin_id)
            tx.memo = (tx.memo or "") + " [시스템 자동승인]"
            notification_service.notify_transaction_approved("withdrawal", user.username, tx.amount, coin)
            await send_system_message(session, tx.user_id, "withdrawal_approved", amount=tx.amount, coin_type=coin)
            auto_approved = True

        await session.commit()
        await session.refresh(tx)
        resp = await _build_response(session, tx)

        await publish_event("new_withdrawal", {
            "user_id": body.user_id, "amount": str(body.amount), "username": user.username,
        })
        notification_service.notify_withdrawal_request(user.username, body.amount, coin)
        if not auto_approved:
            notification_service.notify_large_transaction("withdrawal", user.username, body.amount, coin)

        return resp
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Adjustment ─────────────────────────────────────────────────────

@router.post("/adjustment", response_model=TransactionResponse, status_code=201)
async def manual_adjustment(
    body: AdjustmentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("users.balance")),
):
    try:
        tx = await create_adjustment(
            session, body.user_id, body.action, body.amount, current_user.id, body.memo,
        )
        await session.commit()
        await session.refresh(tx)
        return await _build_response(session, tx)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Approve ────────────────────────────────────────────────────────

@router.post("/transactions/{tx_id}/approve", response_model=TransactionResponse)
async def approve_tx(
    tx_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.approve")),
):
    try:
        tx = await approve_transaction(session, tx_id, current_user.id)
        await session.commit()
        await session.refresh(tx)
        resp = await _build_response(session, tx)
        user = await session.get(User, tx.user_id)
        event_type = "deposit_approved" if tx.type == "deposit" else "withdrawal_approved"
        await publish_event(event_type, {
            "tx_id": tx.id, "user_id": tx.user_id, "amount": str(tx.amount), "type": tx.type,
        })
        notification_service.notify_transaction_approved(tx.type, user.username, tx.amount, tx.coin_type or "USDT")
        # Send in-app message to user
        msg_template = "deposit_approved" if tx.type == "deposit" else "withdrawal_approved"
        await send_system_message(
            session, tx.user_id, msg_template,
            amount=tx.amount, coin_type=tx.coin_type or "USDT",
        )
        await session.commit()
        return resp
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Reject ─────────────────────────────────────────────────────────

@router.post("/transactions/{tx_id}/reject", response_model=TransactionResponse)
async def reject_tx(
    tx_id: int,
    body: TransactionAction = TransactionAction(),
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.reject")),
):
    try:
        tx = await reject_transaction(session, tx_id, current_user.id, body.memo)
        await session.commit()
        await session.refresh(tx)
        resp = await _build_response(session, tx)
        user = await session.get(User, tx.user_id)
        notification_service.notify_transaction_rejected(tx.type, user.username, tx.amount, body.memo or "")
        # Send in-app message to user
        msg_template = "deposit_rejected" if tx.type == "deposit" else "withdrawal_rejected"
        await send_system_message(
            session, tx.user_id, msg_template, reason=body.memo,
        )
        await session.commit()
        return resp
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── Point Adjustment ──────────────────────────────────────────────

@router.post("/point-adjustment", status_code=201)
async def point_adjustment(
    body: PointAdjustmentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("users.balance")),
):
    # Lock user row for concurrent safety
    user_stmt = select(User).where(User.id == body.user_id).with_for_update()
    user = (await session.execute(user_stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    balance_before = user.points

    if body.action == "credit":
        user.points += body.amount
    elif body.action == "debit":
        if user.points < body.amount:
            raise HTTPException(status_code=400, detail=f"포인트 부족: {user.points} < {body.amount}")
        user.points -= body.amount

    log = PointLog(
        user_id=user.id,
        type="admin_adjustment",
        amount=body.amount if body.action == "credit" else -body.amount,
        balance_before=balance_before,
        balance_after=user.points,
        description=body.memo,
        reference_type="admin",
        reference_id=str(current_user.id),
    )
    session.add(log)

    template_key = "point_credit" if body.action == "credit" else "point_debit"
    await send_system_message(
        session, user.id, template_key,
        amount=body.amount, memo=body.memo or "",
    )

    user.updated_at = datetime.now(timezone.utc)
    session.add(user)
    await session.commit()

    return {
        "user_id": user.id,
        "action": body.action,
        "amount": str(body.amount),
        "balance_before": str(balance_before),
        "balance_after": str(user.points),
    }


# ─── Auto-Approve Rules ──────────────────────────────────────────

@router.get("/auto-approve-rules", response_model=AutoApproveRuleListResponse)
async def list_auto_approve_rules(
    type_filter: str | None = Query(None, alias="type"),
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.view")),
):
    base = select(AutoApproveRule)
    if type_filter:
        base = base.where(AutoApproveRule.type == type_filter)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar() or 0

    stmt = base.order_by(AutoApproveRule.created_at.desc())
    result = await session.execute(stmt)
    rules = result.scalars().all()

    return AutoApproveRuleListResponse(
        items=[AutoApproveRuleResponse.model_validate(r, from_attributes=True) for r in rules],
        total=total,
    )


@router.post("/auto-approve-rules", response_model=AutoApproveRuleResponse, status_code=201)
async def create_auto_approve_rule(
    body: AutoApproveRuleCreate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.approve")),
):
    rule = AutoApproveRule(
        type=body.type,
        condition_type=body.condition_type,
        condition_value=body.condition_value,
        max_amount=body.max_amount,
        is_active=body.is_active,
        created_by=current_user.id,
    )
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return AutoApproveRuleResponse.model_validate(rule, from_attributes=True)


@router.put("/auto-approve-rules/{rule_id}", response_model=AutoApproveRuleResponse)
async def update_auto_approve_rule(
    rule_id: int,
    body: AutoApproveRuleUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.approve")),
):
    rule = await session.get(AutoApproveRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    rule.updated_at = datetime.now(timezone.utc)

    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return AutoApproveRuleResponse.model_validate(rule, from_attributes=True)


@router.delete("/auto-approve-rules/{rule_id}", status_code=204)
async def delete_auto_approve_rule(
    rule_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.approve")),
):
    rule = await session.get(AutoApproveRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await session.delete(rule)
    await session.commit()


@router.post("/auto-approve-rules/{rule_id}/toggle", response_model=AutoApproveRuleResponse)
async def toggle_auto_approve_rule(
    rule_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("transaction.approve")),
):
    rule = await session.get(AutoApproveRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.is_active = not rule.is_active
    rule.updated_at = datetime.now(timezone.utc)
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return AutoApproveRuleResponse.model_validate(rule, from_attributes=True)
