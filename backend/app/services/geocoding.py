from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen


@dataclass(slots=True)
class GeocodeResult:
    query: str
    lat: float
    lng: float
    iana_tz: str | None
    provider: str


def geocode_location(query: str) -> GeocodeResult:
    text = (query or "").strip()
    if not text:
        raise ValueError("location query cannot be empty")

    result = _geocode_open_meteo(text)
    if result is not None:
        return result

    raise ValueError(f"unable to geocode location: {query}")


def _geocode_open_meteo(query: str) -> GeocodeResult | None:
    params = urlencode(
        {
            "name": query,
            "count": 1,
            "language": "zh",
            "format": "json",
        }
    )
    url = f"https://geocoding-api.open-meteo.com/v1/search?{params}"
    req = Request(url=url, headers={"User-Agent": "smweb/1.0"}, method="GET")

    try:
        with urlopen(req, timeout=10) as response:
            raw = response.read().decode("utf-8")
    except Exception:
        return None

    try:
        payload: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError:
        return None

    results = payload.get("results")
    if not isinstance(results, list) or not results:
        return None

    hit = results[0]
    try:
        lat = float(hit.get("latitude"))
        lng = float(hit.get("longitude"))
    except (TypeError, ValueError):
        return None

    tz = hit.get("timezone")
    iana_tz = tz.strip() if isinstance(tz, str) and tz.strip() else None

    name = hit.get("name")
    resolved_query = name.strip() if isinstance(name, str) and name.strip() else query

    return GeocodeResult(
        query=resolved_query,
        lat=lat,
        lng=lng,
        iana_tz=iana_tz,
        provider="open-meteo",
    )
