"""Template-based system message service for automatic notifications."""

import logging
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.models.user import User

logger = logging.getLogger(__name__)

TEMPLATES = {
    "reward_granted": {
        "title": "{label} 보상 지급",
        "content": "{label} 보상 {amount}{unit}이(가) 지급되었습니다. {description}",
    },
    "reward_pending": {
        "title": "{label} 보상 승인 대기",
        "content": "{label} 보상 {amount}{unit}이(가) 관리자 승인 대기 중입니다.",
    },
    "reward_rejected": {
        "title": "{label} 보상 거절",
        "content": "{label} 보상 {amount}{unit}이(가) 거절되었습니다.{reason_text}",
    },
    "status_active": {
        "title": "계정 활성화",
        "content": "계정이 활성화되었습니다.",
    },
    "status_suspended": {
        "title": "계정 정지",
        "content": "계정이 정지되었습니다.{reason_text}",
    },
    "status_banned": {
        "title": "계정 차단",
        "content": "계정이 차단되었습니다.{reason_text}",
    },
    "force_logout": {
        "title": "강제 로그아웃",
        "content": "관리자에 의해 로그아웃 처리되었습니다.",
    },
    "deposit_approved": {
        "title": "입금 승인",
        "content": "입금 {amount} {coin_type} 승인되었습니다.",
    },
    "deposit_rejected": {
        "title": "입금 거절",
        "content": "입금이 거절되었습니다.{reason_text}",
    },
    "withdrawal_approved": {
        "title": "출금 승인",
        "content": "출금 {amount} {coin_type} 승인되었습니다.",
    },
    "withdrawal_rejected": {
        "title": "출금 거절",
        "content": "출금이 거절되었습니다.{reason_text}",
    },
    "new_referral": {
        "title": "새 추천 회원 가입",
        "content": "새로운 추천 회원 {username}이(가) 가입했습니다.",
    },
    "point_credit": {
        "title": "포인트 지급",
        "content": "포인트 {amount}P가 지급되었습니다. 사유: {memo}",
    },
    "point_debit": {
        "title": "포인트 차감",
        "content": "포인트 {amount}P가 차감되었습니다. 사유: {memo}",
    },
    "password_reset": {
        "title": "비밀번호 초기화",
        "content": "임시 비밀번호: {password}\n로그인 후 반드시 비밀번호를 변경하세요.",
    },
}


async def send_system_message(
    session: AsyncSession,
    user_id: int,
    template_key: str,
    **kwargs,
) -> Message | None:
    template = TEMPLATES.get(template_key)
    if not template:
        logger.warning("Unknown message template: %s", template_key)
        return None

    # Format reason_text helper
    if "reason" in kwargs and kwargs["reason"]:
        kwargs["reason_text"] = f" 사유: {kwargs['reason']}"
    else:
        kwargs.setdefault("reason_text", "")

    # Format amount with comma
    if "amount" in kwargs and isinstance(kwargs["amount"], (Decimal, int, float)):
        kwargs["amount"] = f"{kwargs['amount']:,.0f}"

    title = template["title"].format(**kwargs)
    content = template["content"].format(**kwargs)

    msg = Message(
        sender_type="system",
        sender_id=0,
        receiver_type="user",
        receiver_id=user_id,
        title=title,
        content=content,
    )
    session.add(msg)
    return msg


async def send_bulk_message(
    session: AsyncSession,
    user_ids: list[int],
    title: str,
    content: str,
) -> int:
    if not user_ids:
        return 0
    for i in range(0, len(user_ids), 1000):
        chunk = user_ids[i:i + 1000]
        values = [
            {
                "sender_type": "system",
                "sender_id": 0,
                "receiver_type": "user",
                "receiver_id": uid,
                "title": title,
                "content": content,
            }
            for uid in chunk
        ]
        await session.execute(insert(Message).values(values))
    return len(user_ids)


async def send_to_filtered_users(
    session: AsyncSession,
    title: str,
    content: str,
    target: str = "all",
    target_value: str | None = None,
) -> int:
    stmt = select(User.id)

    if target == "by_status" and target_value:
        stmt = stmt.where(User.status == target_value)
    elif target == "by_rank" and target_value:
        stmt = stmt.where(User.rank == target_value)
    elif target == "by_ids" and target_value:
        ids = [int(x.strip()) for x in target_value.split(",") if x.strip().isdigit()]
        stmt = stmt.where(User.id.in_(ids))
    # "all" → no filter

    result = await session.execute(stmt)
    user_ids = list(result.scalars().all())
    return await send_bulk_message(session, user_ids, title, content)
