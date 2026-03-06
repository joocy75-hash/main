import asyncio
import logging
from typing import Any

import httpx

from app.config import settings
from app.services.cache_service import cache_get, cache_set

logger = logging.getLogger(__name__)

CACHE_TTL: dict[str, int] = {
    "providers_list": 86400,
    "games_by_provider": 3600,
    "live_events": 30,
    "event_odds": 15,
    "sport_events": 30,
}

HOST_API_MAP: dict[str, str] = {
    "live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com": "casino_api",
    "odds-feed.p.rapidapi.com": "odds_feed",
    "sportapi7.p.rapidapi.com": "sport_api7",
}

MAX_RETRIES = 3
REQUEST_TIMEOUT = 30.0
BACKOFF_BASE = 1.0


class RapidAPIError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"RapidAPI error {status_code}: {message}")


class RapidAPIClient:
    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=REQUEST_TIMEOUT)
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    def _headers(self, host: str) -> dict[str, str]:
        return {
            "x-rapidapi-key": settings.RAPIDAPI_KEY,
            "x-rapidapi-host": host,
        }

    def _resolve_api_name(self, host: str, api_name: str | None) -> str:
        if api_name:
            return api_name
        resolved = HOST_API_MAP.get(host)
        if not resolved:
            logger.warning("Unknown RapidAPI host: %s, using 'unknown'", host)
            return "unknown"
        return resolved

    async def _check_quota(self, api_name: str) -> None:
        from app.services.quota_service import QuotaExceededError, quota_service
        allowed = await quota_service.check_quota(api_name)
        if not allowed:
            raise QuotaExceededError(api_name)

    async def _increment_quota(self, api_name: str) -> None:
        from app.services.quota_service import quota_service
        await quota_service.increment(api_name)

    async def _request(
        self,
        method: str,
        host: str,
        path: str,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        client = await self._get_client()
        url = f"https://{host}{path}"
        headers = self._headers(host)

        last_exc: Exception | None = None
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.request(
                    method,
                    url,
                    headers=headers,
                    params=params,
                    json=json_body,
                )
                if response.status_code == 429:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    logger.warning(
                        "Rate limited by RapidAPI (attempt %d/%d), retrying in %.1fs",
                        attempt + 1, MAX_RETRIES, wait,
                    )
                    await asyncio.sleep(wait)
                    continue

                if response.status_code >= 500:
                    wait = BACKOFF_BASE * (2 ** attempt)
                    logger.warning(
                        "RapidAPI server error %d (attempt %d/%d), retrying in %.1fs",
                        response.status_code, attempt + 1, MAX_RETRIES, wait,
                    )
                    await asyncio.sleep(wait)
                    continue

                if response.status_code >= 400:
                    raise RapidAPIError(response.status_code, response.text[:500])

                data = response.json()
                logger.debug(
                    "RapidAPI %s %s -> %d (%dms)",
                    method, path, response.status_code,
                    int(response.elapsed.total_seconds() * 1000),
                )
                return data

            except (httpx.ConnectError, httpx.ReadTimeout, httpx.WriteTimeout) as exc:
                last_exc = exc
                wait = BACKOFF_BASE * (2 ** attempt)
                logger.warning(
                    "RapidAPI connection error (attempt %d/%d): %s, retrying in %.1fs",
                    attempt + 1, MAX_RETRIES, str(exc), wait,
                )
                await asyncio.sleep(wait)

        raise RapidAPIError(0, f"All {MAX_RETRIES} retries failed: {last_exc}")

    async def get(
        self,
        host: str,
        path: str,
        params: dict[str, Any] | None = None,
        cache_key: str | None = None,
        cache_ttl: int | None = None,
        api_name: str | None = None,
    ) -> dict[str, Any]:
        resolved_api = self._resolve_api_name(host, api_name)

        if cache_key:
            cached = await cache_get(f"rapidapi:{cache_key}")
            if cached is not None:
                logger.debug("Cache hit: rapidapi:%s", cache_key)
                return cached

        await self._check_quota(resolved_api)

        data = await self._request("GET", host, path, params=params)

        await self._increment_quota(resolved_api)

        if cache_key and cache_ttl and cache_ttl > 0:
            await cache_set(f"rapidapi:{cache_key}", data, ttl=cache_ttl)

        return data

    async def post(
        self,
        host: str,
        path: str,
        body: dict[str, Any],
        api_name: str | None = None,
    ) -> dict[str, Any]:
        resolved_api = self._resolve_api_name(host, api_name)

        await self._check_quota(resolved_api)

        data = await self._request("POST", host, path, json_body=body)

        await self._increment_quota(resolved_api)

        return data


rapidapi_client = RapidAPIClient()
