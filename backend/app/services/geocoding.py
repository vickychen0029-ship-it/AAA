from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(slots=True)
class GeocodeResult:
    query: str
    lat: float
    lng: float
    iana_tz: Optional[str]
    provider: str


_MOCK_GEO_DATA = {
    "new york": GeocodeResult(
        query="New York",
        lat=40.7128,
        lng=-74.0060,
        iana_tz="America/New_York",
        provider="mock",
    ),
    "london": GeocodeResult(
        query="London",
        lat=51.5072,
        lng=-0.1276,
        iana_tz="Europe/London",
        provider="mock",
    ),
    "shanghai": GeocodeResult(
        query="Shanghai",
        lat=31.2304,
        lng=121.4737,
        iana_tz="Asia/Shanghai",
        provider="mock",
    ),
}


def geocode_location(query: str) -> GeocodeResult:
    """
    Resolve a place string using a provider chain:
    1) Open-Meteo geocoding (primary)
    2) Nominatim (fallback)

    External network calls are intentionally mocked for now.
    """
    normalized = query.strip().lower()
    if not normalized:
        raise ValueError("location query cannot be empty")

    result = _geocode_open_meteo(normalized)
    if result is not None:
        return result

    fallback = _geocode_nominatim(normalized)
    if fallback is not None:
        return fallback

    raise ValueError(f"unable to geocode location: {query}")


def _geocode_open_meteo(normalized_query: str) -> Optional[GeocodeResult]:
    # TODO: replace with real Open-Meteo geocoding API call and parsing.
    # Mock behavior: only return data for a known subset.
    if normalized_query in _MOCK_GEO_DATA:
        known = _MOCK_GEO_DATA[normalized_query]
        return GeocodeResult(
            query=known.query,
            lat=known.lat,
            lng=known.lng,
            iana_tz=known.iana_tz,
            provider="open-meteo",
        )
    return None


def _geocode_nominatim(normalized_query: str) -> Optional[GeocodeResult]:
    # TODO: replace with real Nominatim geocoding API fallback and parsing.
    # Mock behavior: deterministically infer pseudo coordinates when primary misses.
    if not normalized_query:
        return None

    seed = sum(ord(c) for c in normalized_query)
    lat = ((seed % 18000) / 100.0) - 90.0
    lng = ((seed * 7 % 36000) / 100.0) - 180.0

    return GeocodeResult(
        query=normalized_query,
        lat=round(lat, 6),
        lng=round(lng, 6),
        iana_tz=None,
        provider="nominatim",
    )
