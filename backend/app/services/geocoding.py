from __future__ import annotations

import json
from dataclasses import dataclass
import re
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


BUILTIN_LOCATIONS: dict[str, tuple[float, float, str]] = {
    # China
    "北京": (39.9042, 116.4074, "Asia/Shanghai"),
    "上海": (31.2304, 121.4737, "Asia/Shanghai"),
    "广州": (23.1291, 113.2644, "Asia/Shanghai"),
    "深圳": (22.5431, 114.0579, "Asia/Shanghai"),
    "杭州": (30.2741, 120.1551, "Asia/Shanghai"),
    "南京": (32.0603, 118.7969, "Asia/Shanghai"),
    "武汉": (30.5928, 114.3055, "Asia/Shanghai"),
    "成都": (30.5728, 104.0668, "Asia/Shanghai"),
    "重庆": (29.5630, 106.5516, "Asia/Shanghai"),
    "西安": (34.3416, 108.9398, "Asia/Shanghai"),
    "天津": (39.0842, 117.2009, "Asia/Shanghai"),
    "郑州": (34.7473, 113.6249, "Asia/Shanghai"),
    "长沙": (28.2282, 112.9388, "Asia/Shanghai"),
    "贵阳": (26.6470, 106.6302, "Asia/Shanghai"),
    "遵义": (27.7257, 106.9274, "Asia/Shanghai"),
    "遵义市": (27.7257, 106.9274, "Asia/Shanghai"),
    "贵州遵义": (27.7257, 106.9274, "Asia/Shanghai"),
    "贵州省遵义市": (27.7257, 106.9274, "Asia/Shanghai"),
}


def geocode_location(query: str) -> GeocodeResult:
    text = (query or "").strip()
    if not text:
        raise ValueError("location query cannot be empty")

    for candidate in _build_query_candidates(text):
        result = _geocode_open_meteo(candidate)
        if result is not None:
            return result

        fallback = _geocode_nominatim(candidate)
        if fallback is not None:
            return fallback

        builtin = _geocode_builtin(candidate)
        if builtin is not None:
            return builtin

    raise ValueError(f"unable to geocode location: {query}")


def _geocode_open_meteo(query: str) -> GeocodeResult | None:
    params_obj: dict[str, Any] = {
        "name": query,
        "count": 5,
        "language": "zh",
        "format": "json",
    }
    if _contains_chinese(query):
        params_obj["countryCode"] = "CN"

    params = urlencode(params_obj)
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

    hit = None
    for item in results:
        if isinstance(item, dict):
            hit = item
            break
    if hit is None:
        return None
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


def _geocode_nominatim(query: str) -> GeocodeResult | None:
    params = urlencode(
        {
            "q": query,
            "format": "jsonv2",
            "limit": 1,
            "addressdetails": 1,
        }
    )
    url = f"https://nominatim.openstreetmap.org/search?{params}"
    req = Request(
        url=url,
        headers={
            "User-Agent": "smweb/1.0 (contact: admin@example.com)",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
        method="GET",
    )
    try:
        with urlopen(req, timeout=10) as response:
            raw = response.read().decode("utf-8")
    except Exception:
        return None

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if not isinstance(payload, list) or not payload:
        return None

    hit = payload[0]
    if not isinstance(hit, dict):
        return None

    try:
        lat = float(hit.get("lat"))
        lng = float(hit.get("lon"))
    except (TypeError, ValueError):
        return None

    name = hit.get("display_name")
    resolved_query = name.strip() if isinstance(name, str) and name.strip() else query

    address = hit.get("address") if isinstance(hit.get("address"), dict) else {}
    country_code = str(address.get("country_code", "")).lower()
    iana_tz = "Asia/Shanghai" if country_code == "cn" else None

    return GeocodeResult(
        query=resolved_query,
        lat=lat,
        lng=lng,
        iana_tz=iana_tz,
        provider="nominatim",
    )


def _build_query_candidates(query: str) -> list[str]:
    base = query.strip().replace("，", ",").replace("、", ",").replace("；", ",")
    base = re.sub(r"\s+", " ", base)
    variants = [base]

    compact = base.replace(" ", "")
    if compact and compact != base:
        variants.append(compact)

    first_part = base.split(",")[0].strip()
    if first_part and first_part not in variants:
        variants.append(first_part)

    stripped = _strip_cn_suffix(first_part or base)
    if stripped and stripped not in variants:
        variants.append(stripped)

    if _contains_chinese(base):
        with_country = f"{first_part or base},中国"
        if with_country not in variants:
            variants.append(with_country)
        no_punct = re.sub(r"[,\s]", "", first_part or base)
        if no_punct and no_punct not in variants:
            variants.append(no_punct)

    # Deduplicate and keep non-empty candidates only.
    dedup: list[str] = []
    for item in variants:
        t = item.strip()
        if t and t not in dedup:
            dedup.append(t)
    return dedup


def _strip_cn_suffix(text: str) -> str:
    return re.sub(r"(特别行政区|自治区|自治州|地区|省|市|县|区)$", "", text.strip())


def _contains_chinese(text: str) -> bool:
    return bool(re.search(r"[\u4e00-\u9fff]", text))


def _normalize_builtin_key(text: str) -> str:
    normalized = text.strip()
    normalized = normalized.replace("，", ",").replace("、", ",").replace("；", ",")
    normalized = re.sub(r"\s+", "", normalized)
    normalized = normalized.replace(",", "")
    normalized = re.sub(r"(中华人民共和国|中国)$", "", normalized)
    normalized = re.sub(r"(特别行政区|自治区|自治州|地区|省)$", "", normalized)
    return normalized


def _geocode_builtin(query: str) -> GeocodeResult | None:
    key = _normalize_builtin_key(query)
    if not key:
        return None

    direct = BUILTIN_LOCATIONS.get(key)
    if direct is not None:
        lat, lng, tz = direct
        return GeocodeResult(query=key, lat=lat, lng=lng, iana_tz=tz, provider="builtin")

    for name, (lat, lng, tz) in BUILTIN_LOCATIONS.items():
        nk = _normalize_builtin_key(name)
        if nk and (nk in key or key in nk):
            return GeocodeResult(query=name, lat=lat, lng=lng, iana_tz=tz, provider="builtin")
    return None
