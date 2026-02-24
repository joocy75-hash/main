import logging
from typing import Any

from app.connectors.base import BaseConnector
from app.services.rapidapi_client import RapidAPIClient, CACHE_TTL

logger = logging.getLogger(__name__)

ODDS_HOST = "odds-feed.p.rapidapi.com"
SPORT_HOST = "sportapi7.p.rapidapi.com"

SPORT_NAME_KO: dict[str, str] = {
    "Football": "축구",
    "Tennis": "테니스",
    "Basketball": "농구",
    "Baseball": "야구",
    "Ice Hockey": "아이스하키",
    "Esports": "e스포츠",
    "MMA": "격투기",
    "Volleyball": "배구",
    "Table Tennis": "탁구",
    "Handball": "핸드볼",
    "Cricket": "크리켓",
    "Rugby": "럭비",
    "Boxing": "복싱",
    "Darts": "다트",
    "Snooker": "스누커",
    "Badminton": "배드민턴",
    "American Football": "미식축구",
}

BOOKMAKER_NAME_KO: dict[str, str] = {
    "BETFAIR_EXCHANGE": "베트페어",
    "1XBET": "원엑스벳",
    "STAKE": "스테이크",
    "BWIN": "비윈",
    "UNIBET": "유니벳",
    "BET365": "벳365",
    "PINNACLE": "피나클",
    "MARATHON": "마라톤",
    "BETONLINE": "벳온라인",
    "BETWAY": "벳웨이",
}

ESPORTS_CATEGORIES: dict[str, dict[str, str]] = {
    "Counter-Strike": {"name": "CS2", "icon": "fps"},
    "League of Legends": {"name": "LoL", "icon": "moba"},
    "Dota 2": {"name": "도타2", "icon": "moba"},
    "Valorant": {"name": "발로란트", "icon": "fps"},
    "Overwatch": {"name": "오버워치", "icon": "fps"},
    "Starcraft": {"name": "스타크래프트", "icon": "rts"},
}


def _translate_sport(name: str) -> str:
    return SPORT_NAME_KO.get(name, name)


def _translate_bookmaker(name: str) -> str:
    return BOOKMAKER_NAME_KO.get(name, name)


def _enrich_event(event: dict[str, Any]) -> dict[str, Any]:
    sport = event.get("sport", {})
    if isinstance(sport, dict):
        sport_name = sport.get("name", "")
        event["sport"]["name_ko"] = _translate_sport(sport_name)
    elif isinstance(sport, str):
        event["sport_name_ko"] = _translate_sport(sport)

    status = event.get("status", "")
    status_map: dict[str, str] = {
        "1st Half": "전반전",
        "2nd Half": "후반전",
        "Half Time": "하프타임",
        "Extra Time": "연장전",
        "Penalty": "승부차기",
        "LIVE": "진행중",
        "SCHEDULED": "예정",
        "FINISHED": "종료",
        "POSTPONED": "연기",
        "CANCELLED": "취소",
    }
    event["status_ko"] = status_map.get(status, status)
    return event


class RapidAPISportsConnector(BaseConnector):
    def __init__(
        self,
        provider_id: int,
        api_url: str,
        api_key: str,
        api_secret: str | None = None,
    ) -> None:
        super().__init__(provider_id, api_url, api_key, api_secret)
        self._rapidapi = RapidAPIClient()

    async def authenticate(self) -> bool:
        try:
            data = await self._rapidapi.get(
                ODDS_HOST,
                "/api/v1/events",
                params={"status": "LIVE"},
                cache_key="odds:auth_check",
                cache_ttl=CACHE_TTL["live_events"],
            )
            return isinstance(data, (dict, list))
        except Exception:
            logger.exception("RapidAPI sports authentication failed")
            return False

    async def get_games(self) -> list[dict[str, Any]]:
        return []

    async def get_live_events(self, status: str = "LIVE") -> list[dict[str, Any]]:
        cache_key = f"odds:events:{status.lower()}"
        data = await self._rapidapi.get(
            ODDS_HOST,
            "/api/v1/events",
            params={"status": status},
            cache_key=cache_key,
            cache_ttl=CACHE_TTL["live_events"],
        )
        events = data.get("data", data) if isinstance(data, dict) else data
        if not isinstance(events, list):
            return []

        return [_enrich_event(e) for e in events]

    async def get_event_odds(self, event_id: int) -> list[dict[str, Any]]:
        cache_key = f"odds:markets:{event_id}"
        data = await self._rapidapi.get(
            ODDS_HOST,
            "/api/v1/markets/feed",
            params={"event_ids": str(event_id)},
            cache_key=cache_key,
            cache_ttl=CACHE_TTL["event_odds"],
        )
        raw_markets = data.get("data", data) if isinstance(data, dict) else data
        if not isinstance(raw_markets, list):
            raw_markets = [raw_markets] if isinstance(raw_markets, dict) else []

        result: list[dict[str, Any]] = []
        for market in raw_markets:
            if not isinstance(market, dict):
                continue
            bookmakers = market.get("bookmakers", [])
            if isinstance(bookmakers, list):
                for bm in bookmakers:
                    if isinstance(bm, dict):
                        bm_name = bm.get("name", bm.get("bookmaker", ""))
                        bm["name_ko"] = _translate_bookmaker(bm_name)
            result.append(market)

        return result

    async def get_sport_live(self, sport: str) -> list[dict[str, Any]]:
        cache_key = f"sport7:live:{sport}"
        data = await self._rapidapi.get(
            SPORT_HOST,
            f"/api/v1/sport/{sport}/events/live",
            cache_key=cache_key,
            cache_ttl=CACHE_TTL["sport_events"],
        )
        events = data.get("events", data.get("data", data)) if isinstance(data, dict) else data
        if not isinstance(events, list):
            return []

        enriched: list[dict[str, Any]] = []
        for event in events:
            if not isinstance(event, dict):
                continue

            tournament = event.get("tournament", {})
            category = tournament.get("category", {}) if isinstance(tournament, dict) else {}
            sport_info = category.get("sport", {}) if isinstance(category, dict) else {}
            sport_name = sport_info.get("name", "") if isinstance(sport_info, dict) else ""
            event["sport_name_ko"] = _translate_sport(sport_name) if sport_name else sport

            esport_name = event.get("category", event.get("game", ""))
            if isinstance(esport_name, str) and esport_name in ESPORTS_CATEGORIES:
                event["esport_info"] = ESPORTS_CATEGORIES[esport_name]

            enriched.append(event)

        return enriched

    async def launch_game(
        self, game_code: str, user_id: str, **kwargs: Any
    ) -> dict[str, Any]:
        return {}

    async def get_balance(self, user_id: str) -> dict[str, Any]:
        return {"user_id": user_id, "balance": 0}

    async def get_round_result(self, round_id: str) -> dict[str, Any]:
        return {}

    async def close(self) -> None:
        await self._rapidapi.close()
        await super().close()
