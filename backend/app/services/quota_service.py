"""RapidAPI monthly quota tracking via Redis counters."""

import logging
from datetime import datetime
from typing import ClassVar

from app.config import settings
from app.services.cache_service import get_redis

logger = logging.getLogger(__name__)

QUOTA_TTL = 3024000  # 35 days


class QuotaExceededError(Exception):
    def __init__(self, api_name: str):
        self.api_name = api_name
        super().__init__(f"RapidAPI quota exceeded for {api_name}")


class QuotaService:
    QUOTA_MAP: ClassVar[dict[str, str]] = {
        "odds_feed": "RAPIDAPI_ODDS_QUOTA",
        "sport_api7": "RAPIDAPI_SPORT_QUOTA",
        "casino_api": "RAPIDAPI_CASINO_QUOTA",
    }

    @staticmethod
    def _get_key(api_name: str) -> str:
        month = datetime.now().strftime("%Y-%m")
        return f"rapidapi:quota:{api_name}:{month}"

    @staticmethod
    def _get_limit(api_name: str) -> int:
        attr = QuotaService.QUOTA_MAP.get(api_name)
        if attr is None:
            raise ValueError(f"Unknown API name: {api_name}")
        return getattr(settings, attr)

    async def check_quota(self, api_name: str) -> bool:
        r = await get_redis()
        key = self._get_key(api_name)
        limit = self._get_limit(api_name)
        used = await r.get(key)
        current = int(used) if used else 0
        return current < limit

    async def increment(self, api_name: str) -> int:
        r = await get_redis()
        key = self._get_key(api_name)
        count = await r.incr(key)
        if count == 1:
            await r.expire(key, QUOTA_TTL)
        limit = self._get_limit(api_name)
        logger.info("RapidAPI quota %s: %d/%d", api_name, count, limit)
        return count

    async def get_usage(self, api_name: str) -> dict:
        r = await get_redis()
        key = self._get_key(api_name)
        limit = self._get_limit(api_name)
        used_raw = await r.get(key)
        used = int(used_raw) if used_raw else 0
        remaining = max(limit - used, 0)
        percentage = round((used / limit) * 100, 1) if limit > 0 else 0.0
        return {
            "api_name": api_name,
            "used": used,
            "limit": limit,
            "remaining": remaining,
            "percentage": percentage,
        }

    async def get_all_quotas(self) -> list[dict]:
        results = []
        for api_name in self.QUOTA_MAP:
            usage = await self.get_usage(api_name)
            results.append(usage)
        return results

    async def reset_quota(self, api_name: str) -> None:
        if api_name not in self.QUOTA_MAP:
            raise ValueError(f"Unknown API name: {api_name}")
        r = await get_redis()
        key = self._get_key(api_name)
        await r.delete(key)
        logger.info("RapidAPI quota reset: %s", api_name)

    async def should_warn(self, api_name: str) -> str | None:
        usage = await self.get_usage(api_name)
        pct = usage["percentage"]
        if pct >= 100:
            return "blocked"
        if pct >= 95:
            return "urgent"
        if pct >= 80:
            return "warning"
        return None


quota_service = QuotaService()
