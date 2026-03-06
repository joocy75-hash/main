"""PandaScore (e-sports) + API-Football (sports) integration service.

Replaces RapidAPI-based sports connectors with direct API calls
to PandaScore and API-Football for real-time data.
"""

import logging
from typing import Any

import httpx

from app.config import settings
from app.services.cache_service import cache_get, cache_set

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 10.0

# ═══════════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════════

PANDASCORE_GAME_NAME_KO: dict[str, str] = {
    "League of Legends": "LoL",
    "Counter-Strike": "CS2",
    "CS:GO": "CS2",
    "Dota 2": "도타2",
    "Valorant": "발로란트",
    "Overwatch": "오버워치",
    "PUBG": "PUBG",
    "Rainbow Six Siege": "R6 시즈",
    "Rocket League": "로켓 리그",
    "StarCraft 2": "스타2",
    "StarCraft Brood War": "스타1",
    "LoL Wild Rift": "와일드 리프트",
    "Call of Duty": "CoD",
    "EA Sports FC": "EA FC",
    "King of Glory": "왕자영요",
    "Mobile Legends: Bang Bang": "MLBB",
}

ESPORTS_CATEGORIES: list[dict[str, str]] = [
    {"code": "lol", "name": "League of Legends", "nameKo": "LoL", "icon": "moba"},
    {"code": "cs2", "name": "Counter-Strike", "nameKo": "CS2", "icon": "fps"},
    {"code": "valorant", "name": "Valorant", "nameKo": "발로란트", "icon": "fps"},
    {"code": "dota2", "name": "Dota 2", "nameKo": "도타2", "icon": "moba"},
    {"code": "overwatch", "name": "Overwatch", "nameKo": "오버워치", "icon": "fps"},
    {"code": "pubg", "name": "PUBG", "nameKo": "PUBG", "icon": "fps"},
    {"code": "starcraft", "name": "StarCraft", "nameKo": "스타크래프트", "icon": "rts"},
    {"code": "r6siege", "name": "Rainbow Six Siege", "nameKo": "R6 시즈", "icon": "fps"},
]

SPORT_CATEGORIES: list[dict[str, Any]] = [
    {"code": "football", "name": "Football", "nameKo": "축구", "icon": "football"},
    {"code": "basketball", "name": "Basketball", "nameKo": "농구", "icon": "basketball"},
    {"code": "baseball", "name": "Baseball", "nameKo": "야구", "icon": "baseball"},
    {"code": "tennis", "name": "Tennis", "nameKo": "테니스", "icon": "tennis"},
    {"code": "volleyball", "name": "Volleyball", "nameKo": "배구", "icon": "volleyball"},
    {"code": "ice_hockey", "name": "Ice Hockey", "nameKo": "아이스하키", "icon": "hockey"},
    {"code": "mma", "name": "MMA", "nameKo": "격투기", "icon": "mma"},
    {"code": "table_tennis", "name": "Table Tennis", "nameKo": "탁구", "icon": "table_tennis"},
]

LEAGUE_NAME_KO: dict[str, str] = {
    "Premier League": "프리미어리그",
    "La Liga": "라리가",
    "Bundesliga": "분데스리가",
    "Serie A": "세리에A",
    "Ligue 1": "리그앙",
    "Champions League": "챔피언스리그",
    "Europa League": "유로파리그",
    "K League 1": "K리그1",
    "K League 2": "K리그2",
    "J1 League": "J리그",
    "Chinese Super League": "중국 슈퍼리그",
    "MLS": "MLS",
    "Saudi Pro League": "사우디 프로리그",
    "World Cup": "월드컵",
    "Euro Championship": "유로",
    "AFC Champions League": "AFC 챔피언스리그",
}

FOOTBALL_STATUS_MAP: dict[str, dict[str, Any]] = {
    "1H": {"period": "전반전", "isLive": True},
    "2H": {"period": "후반전", "isLive": True},
    "HT": {"period": "하프타임", "isLive": True},
    "ET": {"period": "연장전", "isLive": True},
    "BT": {"period": "연장 하프타임", "isLive": True},
    "P": {"period": "승부차기", "isLive": True},
    "SUSP": {"period": "중단", "isLive": True},
    "INT": {"period": "중단", "isLive": True},
    "LIVE": {"period": "진행중", "isLive": True},
    "FT": {"period": "경기 종료", "isLive": False},
    "AET": {"period": "연장 종료", "isLive": False},
    "PEN": {"period": "승부차기 종료", "isLive": False},
    "NS": {"period": "", "isLive": False},
    "TBD": {"period": "", "isLive": False},
    "PST": {"period": "연기", "isLive": False},
    "CANC": {"period": "취소", "isLive": False},
    "ABD": {"period": "중단", "isLive": False},
    "WO": {"period": "부전승", "isLive": False},
}


# ═══════════════════════════════════════════════════════════════
# API Clients
# ═══════════════════════════════════════════════════════════════

async def _fetch_json(
    url: str,
    headers: dict[str, str],
    timeout: float = REQUEST_TIMEOUT,
) -> Any:
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        return resp.json()


# ═══════════════════════════════════════════════════════════════
# PandaScore (e-sports)
# ═══════════════════════════════════════════════════════════════

PANDASCORE_BASE = "https://api.pandascore.co"


def _pandascore_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.PANDASCORE_API_KEY}",
        "Accept": "application/json",
    }


def _parse_pandascore_match(m: dict[str, Any], status: str = "LIVE") -> dict[str, Any]:
    opponents = m.get("opponents") or []
    home = opponents[0].get("opponent", {}) if len(opponents) > 0 else {}
    away = opponents[1].get("opponent", {}) if len(opponents) > 1 else {}
    results = m.get("results") or []
    home_score = next((r["score"] for r in results if r.get("team_id") == home.get("id")), 0)
    away_score = next((r["score"] for r in results if r.get("team_id") == away.get("id")), 0)

    game_name = (m.get("videogame") or {}).get("name", "Esports")
    game_name_ko = PANDASCORE_GAME_NAME_KO.get(game_name, game_name)
    league_name = (m.get("league") or {}).get("name", "")
    serie_name = (m.get("serie") or {}).get("full_name") or (m.get("serie") or {}).get("name", "")
    num_games = m.get("number_of_games") or 1
    games_played = sum(1 for g in (m.get("games") or []) if g.get("status") == "finished")

    return {
        "id": m.get("id"),
        "sport": "esports",
        "sportKo": "e스포츠",
        "league": league_name,
        "leagueKo": f"{game_name_ko} - {serie_name or league_name}",
        "status": status,
        "homeTeam": {
            "name": home.get("name", "TBD"),
            "nameKo": home.get("acronym") or home.get("name", "TBD"),
            "logo": home.get("image_url"),
            "score": home_score,
        },
        "awayTeam": {
            "name": away.get("name", "TBD"),
            "nameKo": away.get("acronym") or away.get("name", "TBD"),
            "logo": away.get("image_url"),
            "score": away_score,
        },
        "startTime": m.get("begin_at", ""),
        "elapsed": f"{game_name_ko} - Bo{num_games} ({games_played}/{num_games})",
        "period": f"Bo{num_games} Game {games_played + 1}",
    }


async def get_pandascore_running() -> list[dict[str, Any]]:
    if not settings.PANDASCORE_API_KEY:
        return []

    cached = await cache_get("pandascore:running")
    if cached is not None:
        return cached

    try:
        data = await _fetch_json(
            f"{PANDASCORE_BASE}/matches/running?per_page=50",
            _pandascore_headers(),
        )
        events = [_parse_pandascore_match(m, "LIVE") for m in data]
        await cache_set("pandascore:running", events, ttl=30)
        return events
    except Exception:
        logger.exception("PandaScore running matches fetch failed")
        return []


async def get_pandascore_upcoming() -> list[dict[str, Any]]:
    if not settings.PANDASCORE_API_KEY:
        return []

    cached = await cache_get("pandascore:upcoming")
    if cached is not None:
        return cached

    try:
        data = await _fetch_json(
            f"{PANDASCORE_BASE}/matches/upcoming?per_page=20&sort=begin_at",
            _pandascore_headers(),
        )
        events = [_parse_pandascore_match(m, "SCHEDULED") for m in data]
        await cache_set("pandascore:upcoming", events, ttl=120)
        return events
    except Exception:
        logger.exception("PandaScore upcoming matches fetch failed")
        return []


# ═══════════════════════════════════════════════════════════════
# API-Football (sports)
# ═══════════════════════════════════════════════════════════════

API_FOOTBALL_BASE = "https://v3.football.api-sports.io"


def _api_football_headers() -> dict[str, str]:
    return {"x-apisports-key": settings.API_FOOTBALL_KEY}


def _parse_football_fixture(f: dict[str, Any], status: str = "LIVE") -> dict[str, Any]:
    fixture = f.get("fixture") or {}
    fixture_status = (fixture.get("status") or {}).get("short", "")
    status_info = FOOTBALL_STATUS_MAP.get(fixture_status, {"period": fixture_status, "isLive": True})
    elapsed = (fixture.get("status") or {}).get("elapsed")
    league = f.get("league") or {}
    league_name = league.get("name", "")
    league_country = league.get("country", "")
    teams = f.get("teams") or {}
    goals = f.get("goals") or {}

    return {
        "id": fixture.get("id", 0),
        "sport": "football",
        "sportKo": "축구",
        "league": league_name,
        "leagueKo": LEAGUE_NAME_KO.get(league_name, f"{league_name} ({league_country})"),
        "status": status,
        "homeTeam": {
            "name": (teams.get("home") or {}).get("name", "TBD"),
            "nameKo": (teams.get("home") or {}).get("name", "TBD"),
            "logo": (teams.get("home") or {}).get("logo"),
            "score": goals.get("home", 0),
        },
        "awayTeam": {
            "name": (teams.get("away") or {}).get("name", "TBD"),
            "nameKo": (teams.get("away") or {}).get("name", "TBD"),
            "logo": (teams.get("away") or {}).get("logo"),
            "score": goals.get("away", 0),
        },
        "startTime": fixture.get("date", ""),
        "elapsed": f"{elapsed}'" if elapsed else status_info["period"],
        "period": status_info["period"],
    }


async def get_football_live() -> list[dict[str, Any]]:
    if not settings.API_FOOTBALL_KEY:
        return []

    cached = await cache_get("apifootball:live")
    if cached is not None:
        return cached

    try:
        data = await _fetch_json(
            f"{API_FOOTBALL_BASE}/fixtures?live=all",
            _api_football_headers(),
        )
        fixtures = (data.get("response") or []) if isinstance(data, dict) else []
        events = [_parse_football_fixture(f, "LIVE") for f in fixtures]
        await cache_set("apifootball:live", events, ttl=300)
        return events
    except Exception:
        logger.exception("API-Football live fetch failed")
        return []


async def get_football_scheduled() -> list[dict[str, Any]]:
    if not settings.API_FOOTBALL_KEY:
        return []

    cached = await cache_get("apifootball:scheduled")
    if cached is not None:
        return cached

    try:
        from datetime import datetime, timezone

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        data = await _fetch_json(
            f"{API_FOOTBALL_BASE}/fixtures?date={today}&status=NS-TBD",
            _api_football_headers(),
        )
        fixtures = (data.get("response") or []) if isinstance(data, dict) else []
        events = [_parse_football_fixture(f, "SCHEDULED") for f in fixtures[:30]]
        await cache_set("apifootball:scheduled", events, ttl=1800)
        return events
    except Exception:
        logger.exception("API-Football scheduled fetch failed")
        return []


# ═══════════════════════════════════════════════════════════════
# Unified Service
# ═══════════════════════════════════════════════════════════════

class SportsApiService:
    """Unified service for PandaScore (e-sports) + API-Football (sports)."""

    async def get_live_events(self, sport: str | None = None) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []

        if not sport or sport == "football":
            results.extend(await get_football_live())

        if not sport or sport == "esports":
            results.extend(await get_pandascore_running())

        return results

    async def get_scheduled_events(self, sport: str | None = None) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []

        if not sport or sport == "football":
            results.extend(await get_football_scheduled())

        if not sport or sport == "esports":
            results.extend(await get_pandascore_upcoming())

        return results

    async def get_esports_live(self) -> list[dict[str, Any]]:
        return await get_pandascore_running()

    async def get_esports_upcoming(self) -> list[dict[str, Any]]:
        return await get_pandascore_upcoming()

    def get_sport_categories(self) -> list[dict[str, Any]]:
        return SPORT_CATEGORIES

    def get_esports_categories(self) -> list[dict[str, str]]:
        return ESPORTS_CATEGORIES
