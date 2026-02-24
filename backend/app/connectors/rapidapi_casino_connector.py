import logging
from typing import Any

from app.connectors.base import BaseConnector
from app.services.rapidapi_client import RapidAPIClient, CACHE_TTL

logger = logging.getLogger(__name__)

CASINO_HOST = "live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com"

PROVIDER_CATEGORY_MAP: dict[str, str] = {
    # Live Casino
    "EVOLUTIONLIVE": "casino",
    "PRAGMATICLIVE": "casino",
    "EZUGI": "casino",
    "SAGAMING": "casino",
    "PLAYTECHLIVE": "casino",
    "DREAMGAMING": "casino",
    "WMCASINO": "casino",
    "SEXYGAMING": "casino",
    "ALLBETLIVE": "casino",
    "BIGGAMING": "casino",
    "ASIA_GAMING": "casino",
    # Slots
    "PRAGMATICSLOTS": "slot",
    "PGSOFT": "slot",
    "JILIGAMING": "slot",
    "JDB": "slot",
    "CQ9": "slot",
    "HABANERO": "slot",
    "SPADEGAMING": "slot",
    "MICROGAMING": "slot",
    "NETENT": "slot",
    "HACKSAW": "slot",
    "REDTIGER": "slot",
    "PLAYTECHSLOTS": "slot",
    "BGAMING": "slot",
    "EVOPLAY": "slot",
    "ENDORPHINA": "slot",
    "RELAXGAMING": "slot",
    "BIGTIMEGAMING": "slot",
    "PLAYNGO": "slot",
    "FASTSPIN": "slot",
    "RICH88": "slot",
    "SKYWIND": "slot",
    "PLAYSON": "slot",
    "NOLIMITCITY": "slot",
    "BOOONGO": "slot",
    "YGGDRASIL": "slot",
    "THUNDERKICK": "slot",
    "ISOFTBET": "slot",
    "BLUEPRINT": "slot",
    "ELK": "slot",
    "PUSH_GAMING": "slot",
    "WAZDAN": "slot",
    # Sports
    "BTISPORTS": "sports",
    "SABASPORTS": "sports",
    "DPSPORTS": "sports",
    "CMDSPORTS": "sports",
    # Mini Games
    "SPRIBE": "mini_game",
    "SMARTSOFT": "mini_game",
    "KIRON": "mini_game",
}

DEFAULT_CATEGORY = "slot"


class RapidAPICasinoConnector(BaseConnector):
    def __init__(
        self,
        provider_id: int,
        api_url: str,
        api_key: str,
        api_secret: str | None = None,
    ) -> None:
        super().__init__(provider_id, api_url, api_key, api_secret)
        self._rapidapi = RapidAPIClient()
        self.provider_code: str = api_secret or ""

    async def authenticate(self) -> bool:
        try:
            data = await self._rapidapi.get(
                CASINO_HOST,
                "/getallproviders",
                cache_key="casino:providers",
                cache_ttl=CACHE_TTL["providers_list"],
            )
            providers = data if isinstance(data, list) else data.get("providers", [])
            return len(providers) > 0
        except Exception:
            logger.exception("RapidAPI casino authentication failed")
            return False

    async def get_providers(self) -> list[dict[str, Any]]:
        data = await self._rapidapi.get(
            CASINO_HOST,
            "/getallproviders",
            cache_key="casino:providers",
            cache_ttl=CACHE_TTL["providers_list"],
        )
        raw = data if isinstance(data, list) else data.get("providers", [])
        result: list[dict[str, Any]] = []
        for p in raw:
            code = p if isinstance(p, str) else p.get("code", p.get("provider", ""))
            code_upper = str(code).upper()
            result.append({
                "code": code,
                "name": code,
                "category": PROVIDER_CATEGORY_MAP.get(code_upper, DEFAULT_CATEGORY),
            })
        return result

    async def get_games(self) -> list[dict[str, Any]]:
        if not self.provider_code:
            return []

        cache_key = f"casino:games:{self.provider_code}"
        data = await self._rapidapi.get(
            CASINO_HOST,
            "/getallgamesandprovider",
            params={"provider": self.provider_code},
            cache_key=cache_key,
            cache_ttl=CACHE_TTL["games_by_provider"],
        )
        games = data.get("games", []) if isinstance(data, dict) else data
        if not isinstance(games, list):
            games = []

        return [
            {
                "code": str(g.get("id", "")),
                "name": g.get("name", ""),
                "thumbnail_url": g.get("img"),
                "provider": g.get("provider", self.provider_code),
                "category": PROVIDER_CATEGORY_MAP.get(
                    str(g.get("provider", self.provider_code)).upper(),
                    DEFAULT_CATEGORY,
                ),
                "is_active": True,
            }
            for g in games
            if g.get("id") and g.get("name")
        ]

    async def launch_game(
        self, game_code: str, user_id: str, **kwargs: Any
    ) -> dict[str, Any]:
        body = {
            "username": user_id,
            "gameId": game_code,
            "lang": kwargs.get("language", "ko"),
            "money": kwargs.get("money", 0),
            "home_url": kwargs.get("home_url", ""),
            "platform": kwargs.get("platform", 1),
            "currency": kwargs.get("currency", "KRW"),
        }
        data = await self._rapidapi.post(CASINO_HOST, "/getgameurl", body)
        return {
            "game_url": data.get("url", data.get("game_url", "")),
            "session_id": data.get("session_id", ""),
            "raw": data,
        }

    async def get_balance(self, user_id: str) -> dict[str, Any]:
        return {"user_id": user_id, "balance": 0, "currency": "KRW"}

    async def get_round_result(self, round_id: str) -> dict[str, Any]:
        return {}

    async def close(self) -> None:
        await self._rapidapi.close()
        await super().close()
