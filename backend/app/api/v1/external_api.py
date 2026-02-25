"""Unified external API router for RapidAPI casino, sports, and e-sports endpoints."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PermissionChecker
from app.config import settings
from app.connectors.rapidapi_casino_connector import (
    CASINO_HOST,
    PROVIDER_CATEGORY_MAP,
    RapidAPICasinoConnector,
)
from app.connectors.rapidapi_sports_connector import (
    ESPORTS_CATEGORIES,
    ODDS_HOST,
    SPORT_HOST,
    RapidAPISportsConnector,
)
from app.database import get_session
from app.models.admin_user import AdminUser
from app.models.game import Game, GameProvider
from app.services.cache_service import cache_delete_pattern
from app.services.quota_service import QuotaExceededError, QuotaService
from app.services.rapidapi_client import RapidAPIError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/external-api", tags=["external-api"])


class GameLaunchRequest(BaseModel):
    user_id: int
    game_id: str
    platform: int = 1
    home_url: str = ""
    currency: str = "KRW"


# ═══════════════════════════════════════════════════════════════════
# Quota Management
# ═══════════════════════════════════════════════════════════════════


@router.get("/quotas")
async def get_quotas(
    current_user: AdminUser = Depends(PermissionChecker("game_provider.view")),
):
    try:
        svc = QuotaService()
        return await svc.get_all_quotas()
    except Exception as exc:
        logger.exception("Failed to fetch quota status")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/quotas/reset/{api_name}")
async def reset_quota(
    api_name: str,
    current_user: AdminUser = Depends(PermissionChecker("setting.edit")),
):
    try:
        svc = QuotaService()
        await svc.reset_quota(api_name)
        return {"message": f"Quota reset for {api_name}"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to reset quota for %s", api_name)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ═══════════════════════════════════════════════════════════════════
# Casino Provider Sync
# ═══════════════════════════════════════════════════════════════════


@router.post("/casino/sync-providers")
async def sync_providers(
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("game_provider.edit")),
):
    connector = RapidAPICasinoConnector(
        provider_id=0,
        api_url="https://rapidapi.com",
        api_key=settings.RAPIDAPI_KEY,
    )
    try:
        providers = await connector.get_providers()
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()

    new_count = 0
    updated_count = 0

    for p in providers:
        code = p.get("code", "")
        if not code:
            continue

        result = await session.execute(
            select(GameProvider).where(GameProvider.code == code)
        )
        existing = result.scalar_one_or_none()

        category = PROVIDER_CATEGORY_MAP.get(str(code).upper(), "slot")

        if existing:
            existing.name = p.get("name", code)
            existing.category = category
            existing.api_url = "https://rapidapi.com"
            existing.api_key = "rapidapi"
            existing.is_active = True
            existing.updated_at = datetime.now(timezone.utc)
            session.add(existing)
            updated_count += 1
        else:
            provider_obj = GameProvider(
                name=p.get("name", code),
                code=code,
                category=category,
                api_url="https://rapidapi.com",
                api_key="rapidapi",
                is_active=True,
            )
            session.add(provider_obj)
            new_count += 1

    await session.commit()

    total_stmt = select(func.count()).select_from(GameProvider)
    total = (await session.execute(total_stmt)).scalar() or 0

    return {
        "new_count": new_count,
        "updated_count": updated_count,
        "total_count": total,
    }


# ═══════════════════════════════════════════════════════════════════
# Casino Game Sync
# ═══════════════════════════════════════════════════════════════════


@router.post("/casino/sync-games/{provider_code}")
async def sync_games(
    provider_code: str,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("game_provider.edit")),
):
    result = await session.execute(
        select(GameProvider).where(GameProvider.code == provider_code)
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    connector = RapidAPICasinoConnector(
        provider_id=provider.id,
        api_url="https://rapidapi.com",
        api_key=settings.RAPIDAPI_KEY,
        api_secret=provider_code,
    )
    try:
        games = await connector.get_games()
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()

    new_count = 0
    updated_count = 0

    for g in games:
        code = g.get("code", "")
        if not code:
            continue

        full_code = f"{provider_code}_{code}"

        existing_result = await session.execute(
            select(Game).where(Game.code == full_code)
        )
        existing_game = existing_result.scalar_one_or_none()

        if existing_game:
            existing_game.name = g.get("name", existing_game.name)
            existing_game.thumbnail_url = g.get("thumbnail_url", existing_game.thumbnail_url)
            existing_game.category = g.get("category", existing_game.category)
            existing_game.is_active = g.get("is_active", True)
            existing_game.updated_at = datetime.now(timezone.utc)
            session.add(existing_game)
            updated_count += 1
        else:
            new_game = Game(
                provider_id=provider.id,
                name=g.get("name", code),
                code=full_code,
                category=g.get("category", provider.category),
                is_active=g.get("is_active", True),
                thumbnail_url=g.get("thumbnail_url"),
            )
            session.add(new_game)
            new_count += 1

    provider.updated_at = datetime.now(timezone.utc)
    session.add(provider)
    await session.commit()

    await cache_delete_pattern("games:list")

    total_stmt = select(func.count()).where(Game.provider_id == provider.id)
    total = (await session.execute(total_stmt)).scalar() or 0

    return {
        "provider": provider_code,
        "new_count": new_count,
        "updated_count": updated_count,
        "total_count": total,
    }


@router.post("/casino/sync-all-games")
async def sync_all_games(
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("game_provider.edit")),
):
    stmt = select(GameProvider).where(
        GameProvider.is_active == True,
        GameProvider.api_url.contains("rapidapi"),
    )
    result = await session.execute(stmt)
    providers = result.scalars().all()

    total_new = 0
    total_updated = 0
    providers_synced = 0
    errors: list[dict] = []

    for provider in providers:
        connector = RapidAPICasinoConnector(
            provider_id=provider.id,
            api_url="https://rapidapi.com",
            api_key=settings.RAPIDAPI_KEY,
            api_secret=provider.code,
        )
        try:
            games = await connector.get_games()
        except QuotaExceededError:
            errors.append({"provider": provider.code, "error": "Quota exceeded"})
            await connector.close()
            break
        except RapidAPIError as exc:
            errors.append({"provider": provider.code, "error": exc.message})
            await connector.close()
            continue
        finally:
            await connector.close()

        new_count = 0
        updated_count = 0

        for g in games:
            code = g.get("code", "")
            if not code:
                continue

            full_code = f"{provider.code}_{code}"

            existing_result = await session.execute(
                select(Game).where(Game.code == full_code)
            )
            existing_game = existing_result.scalar_one_or_none()

            if existing_game:
                existing_game.name = g.get("name", existing_game.name)
                existing_game.thumbnail_url = g.get("thumbnail_url", existing_game.thumbnail_url)
                existing_game.category = g.get("category", existing_game.category)
                existing_game.is_active = g.get("is_active", True)
                existing_game.updated_at = datetime.now(timezone.utc)
                session.add(existing_game)
                updated_count += 1
            else:
                new_game = Game(
                    provider_id=provider.id,
                    name=g.get("name", code),
                    code=full_code,
                    category=g.get("category", provider.category),
                    is_active=g.get("is_active", True),
                    thumbnail_url=g.get("thumbnail_url"),
                )
                session.add(new_game)
                new_count += 1

        provider.updated_at = datetime.now(timezone.utc)
        session.add(provider)
        await session.commit()

        total_new += new_count
        total_updated += updated_count
        providers_synced += 1

    await cache_delete_pattern("games:list")

    total_games_stmt = select(func.count()).select_from(Game)
    total_games = (await session.execute(total_games_stmt)).scalar() or 0

    response: dict = {
        "providers_synced": providers_synced,
        "total_new": total_new,
        "total_updated": total_updated,
        "total_games": total_games,
    }
    if errors:
        response["errors"] = errors

    return response


# ═══════════════════════════════════════════════════════════════════
# Casino Game Launch
# ═══════════════════════════════════════════════════════════════════


@router.post("/casino/launch")
async def launch_game(
    body: GameLaunchRequest,
    session: AsyncSession = Depends(get_session),
    current_user: AdminUser = Depends(PermissionChecker("game_provider.view")),
):
    result = await session.execute(
        select(Game).where(Game.code == body.game_id)
    )
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if not game.is_active:
        raise HTTPException(status_code=403, detail="Game is currently disabled")

    provider = await session.get(GameProvider, game.provider_id)
    if not provider or not provider.is_active:
        raise HTTPException(status_code=403, detail="Game provider is disabled")

    game_code_parts = game.code.split("_", 1)
    raw_game_code = game_code_parts[1] if len(game_code_parts) > 1 else game.code

    connector = RapidAPICasinoConnector(
        provider_id=provider.id,
        api_url="https://rapidapi.com",
        api_key=settings.RAPIDAPI_KEY,
        api_secret=provider.code,
    )
    try:
        launch_data = await connector.launch_game(
            game_code=raw_game_code,
            user_id=str(body.user_id),
            platform=body.platform,
            home_url=body.home_url,
            currency=body.currency,
        )
        return launch_data
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


# ═══════════════════════════════════════════════════════════════════
# Sports Events (Odds Feed)
# ═══════════════════════════════════════════════════════════════════


def _sports_connector() -> RapidAPISportsConnector:
    return RapidAPISportsConnector(
        provider_id=0,
        api_url="https://rapidapi.com",
        api_key=settings.RAPIDAPI_KEY,
    )


@router.get("/sports/events")
async def get_sports_events(
    status: str = "LIVE",
    current_user: AdminUser = Depends(PermissionChecker("game_provider.view")),
):
    connector = _sports_connector()
    try:
        return await connector.get_live_events(status)
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


@router.get("/sports/odds/{event_id}")
async def get_sports_odds(
    event_id: int,
    current_user: AdminUser = Depends(PermissionChecker("game_provider.view")),
):
    connector = _sports_connector()
    try:
        return await connector.get_event_odds(event_id)
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


@router.get("/sports/live/{sport}")
async def get_sport_live(
    sport: str,
    current_user: AdminUser = Depends(PermissionChecker("game_provider.view")),
):
    connector = _sports_connector()
    try:
        return await connector.get_sport_live(sport)
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


# ═══════════════════════════════════════════════════════════════════
# Sports Aggregator (Odds + SportAPI7 combined)
# ═══════════════════════════════════════════════════════════════════


@router.get("/sports/enriched/{sport}")
async def get_enriched_sport_events(
    sport: str,
    current_user: AdminUser = Depends(PermissionChecker("game_provider.view")),
):
    connector = _sports_connector()
    try:
        sport7_events = await connector.get_sport_live(sport)
        odds_events = await connector.get_live_events("LIVE")
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()

    odds_by_teams: dict[str, dict] = {}
    for event in odds_events:
        if not isinstance(event, dict):
            continue
        home = event.get("homeTeam", event.get("home", {}))
        away = event.get("awayTeam", event.get("away", {}))
        home_name = home.get("name", "") if isinstance(home, dict) else str(home)
        away_name = away.get("name", "") if isinstance(away, dict) else str(away)
        if home_name and away_name:
            key = f"{home_name.lower()}|{away_name.lower()}"
            odds_by_teams[key] = event

    enriched: list[dict] = []
    for event in sport7_events:
        if not isinstance(event, dict):
            continue
        home_team = event.get("homeTeam", event.get("home", {}))
        away_team = event.get("awayTeam", event.get("away", {}))
        home_name = home_team.get("name", "") if isinstance(home_team, dict) else str(home_team)
        away_name = away_team.get("name", "") if isinstance(away_team, dict) else str(away_team)

        matched_odds = None
        if home_name and away_name:
            key = f"{home_name.lower()}|{away_name.lower()}"
            matched_odds = odds_by_teams.get(key)

        combined = {**event}
        if matched_odds:
            combined["odds_data"] = matched_odds
            combined["odds_matched"] = True
        else:
            combined["odds_matched"] = False

        enriched.append(combined)

    return enriched


# ═══════════════════════════════════════════════════════════════════
# E-Sports
# ═══════════════════════════════════════════════════════════════════


@router.get("/esports/live")
async def get_esports_live(
    current_user: AdminUser = Depends(PermissionChecker("game_provider.view")),
):
    connector = _sports_connector()
    try:
        return await connector.get_sport_live("esports")
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


@router.get("/esports/categories")
async def get_esports_categories(
    current_user: AdminUser = Depends(PermissionChecker("game_provider.view")),
):
    return ESPORTS_CATEGORIES


# ═══════════════════════════════════════════════════════════════════
# User-Page Proxy (service token authentication)
# ═══════════════════════════════════════════════════════════════════


async def verify_service_token(x_service_token: str = Header(...)):
    expected = settings.USER_PAGE_SERVICE_TOKEN
    if not expected or x_service_token != expected:
        raise HTTPException(status_code=401, detail="Invalid service token")


user_proxy_router = APIRouter(prefix="/user-proxy", tags=["user-proxy"])


@user_proxy_router.get("/casino/providers")
async def proxy_casino_providers(_: str = Depends(verify_service_token)):
    connector = RapidAPICasinoConnector(
        provider_id=0,
        api_url="https://rapidapi.com",
        api_key=settings.RAPIDAPI_KEY,
    )
    try:
        return await connector.get_providers()
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


@user_proxy_router.get("/casino/games/{provider_code}")
async def proxy_casino_games(
    provider_code: str,
    _: str = Depends(verify_service_token),
):
    connector = RapidAPICasinoConnector(
        provider_id=0,
        api_url="https://rapidapi.com",
        api_key=settings.RAPIDAPI_KEY,
        api_secret=provider_code,
    )
    try:
        return await connector.get_games()
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


@user_proxy_router.post("/casino/launch")
async def proxy_casino_launch(
    body: GameLaunchRequest,
    session: AsyncSession = Depends(get_session),
    _: str = Depends(verify_service_token),
):
    result = await session.execute(
        select(Game).where(Game.code == body.game_id)
    )
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if not game.is_active:
        raise HTTPException(status_code=403, detail="Game is currently disabled")

    provider = await session.get(GameProvider, game.provider_id)
    if not provider or not provider.is_active:
        raise HTTPException(status_code=403, detail="Game provider is disabled")

    game_code_parts = game.code.split("_", 1)
    raw_game_code = game_code_parts[1] if len(game_code_parts) > 1 else game.code

    connector = RapidAPICasinoConnector(
        provider_id=provider.id,
        api_url="https://rapidapi.com",
        api_key=settings.RAPIDAPI_KEY,
        api_secret=provider.code,
    )
    try:
        return await connector.launch_game(
            game_code=raw_game_code,
            user_id=str(body.user_id),
            platform=body.platform,
            home_url=body.home_url,
            currency=body.currency,
        )
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


@user_proxy_router.get("/sports/events")
async def proxy_sports_events(
    status: str = "LIVE",
    _: str = Depends(verify_service_token),
):
    connector = _sports_connector()
    try:
        return await connector.get_live_events(status)
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


@user_proxy_router.get("/sports/odds/{event_id}")
async def proxy_sports_odds(
    event_id: int,
    _: str = Depends(verify_service_token),
):
    connector = _sports_connector()
    try:
        return await connector.get_event_odds(event_id)
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


@user_proxy_router.get("/sports/live/{sport}")
async def proxy_sport_live(
    sport: str,
    _: str = Depends(verify_service_token),
):
    connector = _sports_connector()
    try:
        return await connector.get_sport_live(sport)
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


@user_proxy_router.get("/sports/enriched/{sport}")
async def proxy_enriched_events(
    sport: str,
    _: str = Depends(verify_service_token),
):
    connector = _sports_connector()
    try:
        sport7_events = await connector.get_sport_live(sport)
        odds_events = await connector.get_live_events("LIVE")
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()

    odds_by_teams: dict[str, dict] = {}
    for event in odds_events:
        if not isinstance(event, dict):
            continue
        home = event.get("homeTeam", event.get("home", {}))
        away = event.get("awayTeam", event.get("away", {}))
        home_name = home.get("name", "") if isinstance(home, dict) else str(home)
        away_name = away.get("name", "") if isinstance(away, dict) else str(away)
        if home_name and away_name:
            key = f"{home_name.lower()}|{away_name.lower()}"
            odds_by_teams[key] = event

    enriched: list[dict] = []
    for event in sport7_events:
        if not isinstance(event, dict):
            continue
        home_team = event.get("homeTeam", event.get("home", {}))
        away_team = event.get("awayTeam", event.get("away", {}))
        home_name = home_team.get("name", "") if isinstance(home_team, dict) else str(home_team)
        away_name = away_team.get("name", "") if isinstance(away_team, dict) else str(away_team)

        matched_odds = None
        if home_name and away_name:
            key = f"{home_name.lower()}|{away_name.lower()}"
            matched_odds = odds_by_teams.get(key)

        combined = {**event}
        if matched_odds:
            combined["odds_data"] = matched_odds
            combined["odds_matched"] = True
        else:
            combined["odds_matched"] = False

        enriched.append(combined)

    return enriched


@user_proxy_router.get("/esports/live")
async def proxy_esports_live(_: str = Depends(verify_service_token)):
    connector = _sports_connector()
    try:
        return await connector.get_sport_live("esports")
    except QuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RapidAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    finally:
        await connector.close()


@user_proxy_router.get("/esports/categories")
async def proxy_esports_categories(_: str = Depends(verify_service_token)):
    return ESPORTS_CATEGORIES
