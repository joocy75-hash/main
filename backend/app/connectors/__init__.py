"""Connector factory - instantiate the right connector by category."""

from app.config import settings
from app.connectors.base import BaseConnector
from app.connectors.casino_connector import CasinoConnector
from app.connectors.holdem_connector import HoldemConnector
from app.connectors.rapidapi_casino_connector import RapidAPICasinoConnector
from app.connectors.rapidapi_sports_connector import RapidAPISportsConnector
from app.connectors.slot_connector import SlotConnector
from app.connectors.sports_connector import SportsConnector

LEGACY_CONNECTOR_MAP: dict[str, type[BaseConnector]] = {
    "casino": CasinoConnector,
    "slot": SlotConnector,
    "sports": SportsConnector,
    "esports": SportsConnector,
    "holdem": HoldemConnector,
    "mini_game": SlotConnector,
    "virtual_soccer": SportsConnector,
}

RAPIDAPI_CONNECTOR_MAP: dict[str, type[BaseConnector]] = {
    "casino": RapidAPICasinoConnector,
    "slot": RapidAPICasinoConnector,
    "sports": RapidAPISportsConnector,
    "esports": RapidAPISportsConnector,
    "holdem": HoldemConnector,
    "mini_game": RapidAPICasinoConnector,
    "virtual_soccer": RapidAPISportsConnector,
}


def get_connector(
    category: str,
    provider_id: int,
    api_url: str,
    api_key: str,
    api_secret: str | None = None,
) -> BaseConnector:
    use_rapidapi = getattr(settings, "RAPIDAPI_KEY", None)
    connector_map = RAPIDAPI_CONNECTOR_MAP if use_rapidapi else LEGACY_CONNECTOR_MAP
    connector_class = connector_map.get(category)
    if not connector_class:
        raise ValueError(f"Unknown category: {category}")
    return connector_class(
        provider_id=provider_id,
        api_url=api_url,
        api_key=api_key,
        api_secret=api_secret,
    )


def get_rapidapi_connector(
    category: str,
    provider_id: int = 0,
    provider_code: str = "",
) -> BaseConnector:
    connector_class = RAPIDAPI_CONNECTOR_MAP.get(category, RapidAPICasinoConnector)
    return connector_class(
        provider_id=provider_id,
        api_url="https://rapidapi.com",
        api_key=settings.RAPIDAPI_KEY,
        api_secret=provider_code,
    )
