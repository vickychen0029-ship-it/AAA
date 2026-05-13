from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


_SIGNS = (
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
)

_PLANET_KEYS = (
    ("sun", "Sun", "SUN"),
    ("moon", "Moon", "MOON"),
    ("mercury", "Mercury", "MERCURY"),
    ("venus", "Venus", "VENUS"),
    ("mars", "Mars", "MARS"),
    ("jupiter", "Jupiter", "JUPITER"),
    ("saturn", "Saturn", "SATURN"),
    ("uranus", "Uranus", "URANUS"),
    ("neptune", "Neptune", "NEPTUNE"),
    ("pluto", "Pluto", "PLUTO"),
)

_ASPECTS = (
    ("conjunction", 0.0, 8.0),
    ("sextile", 60.0, 4.0),
    ("square", 90.0, 6.0),
    ("trine", 120.0, 6.0),
    ("opposition", 180.0, 8.0),
)


class SwissEphemerisService:
    """
    Wrapper around pyswisseph with deterministic mock fallback.

    This keeps API behavior stable even when the optional native dependency
    is unavailable in local/dev environments.
    """

    def __init__(self) -> None:
        self._swe: Any | None = None
        self._source = "mock"
        self._import_error: str | None = None

        try:
            import swisseph as swe  # type: ignore[import-not-found]

            self._swe = swe
            self._source = "swisseph"
        except Exception as exc:  # pragma: no cover - depends on runtime env
            self._import_error = str(exc)

    @property
    def source(self) -> str:
        return self._source

    def compute_natal_chart(
        self,
        *,
        birth_utc_dt: datetime,
        lat: float,
        lng: float,
        house_system: str = "P",
    ) -> dict[str, Any]:
        if birth_utc_dt.tzinfo is None:
            raise ValueError("birth_utc_dt must include timezone information")

        if house_system.strip() == "":
            raise ValueError("house_system cannot be empty")

        dt_utc = birth_utc_dt.astimezone(timezone.utc)
        hsys = house_system.strip().upper()[0]

        if self._swe is None:
            return self._build_mock_chart(
                birth_utc_dt=dt_utc,
                lat=lat,
                lng=lng,
                house_system=hsys,
                fallback_reason=self._import_error,
            )

        try:
            return self._build_swisseph_chart(
                birth_utc_dt=dt_utc,
                lat=lat,
                lng=lng,
                house_system=hsys,
            )
        except Exception as exc:  # pragma: no cover - defensive runtime fallback
            return self._build_mock_chart(
                birth_utc_dt=dt_utc,
                lat=lat,
                lng=lng,
                house_system=hsys,
                fallback_reason=str(exc),
            )

    def _build_swisseph_chart(
        self,
        *,
        birth_utc_dt: datetime,
        lat: float,
        lng: float,
        house_system: str,
    ) -> dict[str, Any]:
        swe = self._swe
        if swe is None:
            raise RuntimeError("swisseph runtime unavailable")

        jd_ut = _to_julian_day_ut(swe=swe, dt_utc=birth_utc_dt)
        iflag = int(getattr(swe, "FLG_SWIEPH", 0)) | int(getattr(swe, "FLG_SPEED", 0))

        planets: list[dict[str, Any]] = []
        for key, label, swe_name in _PLANET_KEYS:
            swe_id = getattr(swe, swe_name, None)
            if swe_id is None:
                continue

            coords, retflags = _calc_ut(swe=swe, jd_ut=jd_ut, swe_id=int(swe_id), iflag=iflag)
            lon = _normalize_deg(float(coords[0]))
            lat_ecl = float(coords[1])
            speed = float(coords[3]) if len(coords) > 3 else 0.0
            sign_name, sign_index, degree_in_sign = _to_sign(lon)
            planets.append(
                {
                    "key": key,
                    "name": label,
                    "longitude": round(lon, 6),
                    "latitude": round(lat_ecl, 6),
                    "speed_longitude": round(speed, 6),
                    "sign": sign_name,
                    "sign_index": sign_index,
                    "degree_in_sign": round(degree_in_sign, 6),
                    "retrograde": speed < 0,
                    "retflags": int(retflags),
                }
            )

        cusps, ascmc = _houses(
            swe=swe,
            jd_ut=jd_ut,
            lat=lat,
            lng=lng,
            house_system=house_system,
        )
        house_longitudes = _extract_house_cusps(cusps)
        houses: list[dict[str, Any]] = []
        for index, cusp in enumerate(house_longitudes, start=1):
            sign_name, sign_index, degree_in_sign = _to_sign(cusp)
            houses.append(
                {
                    "house": index,
                    "longitude": round(cusp, 6),
                    "sign": sign_name,
                    "sign_index": sign_index,
                    "degree_in_sign": round(degree_in_sign, 6),
                }
            )

        asc = _normalize_deg(float(ascmc[0])) if len(ascmc) > 0 else house_longitudes[0]
        mc = _normalize_deg(float(ascmc[1])) if len(ascmc) > 1 else house_longitudes[9]
        aspects = _build_aspects(planets)

        return {
            "chart_system": "western_tropical",
            "ephemeris_source": "swisseph",
            "house_system": house_system,
            "birth_utc_dt": birth_utc_dt.isoformat(),
            "julian_day_ut": round(jd_ut, 8),
            "geo": {"lat": lat, "lng": lng},
            "angles": {"asc": round(asc, 6), "mc": round(mc, 6)},
            "planets": planets,
            "houses": houses,
            "aspects": aspects,
        }

    def _build_mock_chart(
        self,
        *,
        birth_utc_dt: datetime,
        lat: float,
        lng: float,
        house_system: str,
        fallback_reason: str | None = None,
    ) -> dict[str, Any]:
        seed = (
            int(birth_utc_dt.timestamp() // 60)
            + int((lat + 90.0) * 100)
            + int((lng + 180.0) * 100)
        )
        base = float(seed % 360)

        planets: list[dict[str, Any]] = []
        for index, (key, label, _) in enumerate(_PLANET_KEYS):
            lon = _normalize_deg(base + (index * 31.137) + (index * index * 2.711))
            lat_ecl = round((((seed + index * 97) % 1200) / 100.0) - 6.0, 6)
            speed = round(((seed + index * 17) % 2300) / 200.0 - 5.0, 6)
            sign_name, sign_index, degree_in_sign = _to_sign(lon)
            planets.append(
                {
                    "key": key,
                    "name": label,
                    "longitude": round(lon, 6),
                    "latitude": lat_ecl,
                    "speed_longitude": speed,
                    "sign": sign_name,
                    "sign_index": sign_index,
                    "degree_in_sign": round(degree_in_sign, 6),
                    "retrograde": speed < 0,
                }
            )

        asc = _normalize_deg(base + 101.123)
        mc = _normalize_deg(asc + 90.0)
        houses: list[dict[str, Any]] = []
        for idx in range(12):
            cusp = _normalize_deg(asc + idx * 30.0)
            sign_name, sign_index, degree_in_sign = _to_sign(cusp)
            houses.append(
                {
                    "house": idx + 1,
                    "longitude": round(cusp, 6),
                    "sign": sign_name,
                    "sign_index": sign_index,
                    "degree_in_sign": round(degree_in_sign, 6),
                }
            )

        aspects = _build_aspects(planets)
        payload: dict[str, Any] = {
            "chart_system": "western_tropical",
            "ephemeris_source": "mock",
            "house_system": house_system,
            "birth_utc_dt": birth_utc_dt.isoformat(),
            "geo": {"lat": lat, "lng": lng},
            "angles": {"asc": round(asc, 6), "mc": round(mc, 6)},
            "planets": planets,
            "houses": houses,
            "aspects": aspects,
        }
        if fallback_reason:
            payload["fallback_reason"] = fallback_reason
        return payload


def _to_julian_day_ut(*, swe: Any, dt_utc: datetime) -> float:
    jd_pair = swe.utc_to_jd(
        dt_utc.year,
        dt_utc.month,
        dt_utc.day,
        dt_utc.hour,
        dt_utc.minute,
        dt_utc.second + (dt_utc.microsecond / 1_000_000.0),
        getattr(swe, "GREG_CAL", 1),
    )
    if isinstance(jd_pair, (tuple, list)) and len(jd_pair) >= 2:
        return float(jd_pair[1])  # UT
    if isinstance(jd_pair, (tuple, list)) and len(jd_pair) == 1:
        return float(jd_pair[0])
    return float(jd_pair)


def _calc_ut(*, swe: Any, jd_ut: float, swe_id: int, iflag: int) -> tuple[list[float], int]:
    raw = swe.calc_ut(jd_ut, swe_id, iflag)
    if isinstance(raw, (tuple, list)) and len(raw) >= 2 and isinstance(raw[0], (tuple, list)):
        coords = [float(v) for v in raw[0]]
        retflags = int(raw[1])
        return coords, retflags
    if isinstance(raw, (tuple, list)):
        coords = [float(v) for v in raw[:6]]
        return coords, 0
    raise RuntimeError("unexpected swisseph calc_ut result shape")


def _houses(*, swe: Any, jd_ut: float, lat: float, lng: float, house_system: str) -> tuple[Any, Any]:
    hsys = house_system.encode("ascii", "ignore")
    try:
        return swe.houses(jd_ut, lat, lng, hsys)
    except TypeError:
        return swe.houses(jd_ut, lat, lng, house_system)


def _extract_house_cusps(raw_cusps: Any) -> list[float]:
    cusps = [float(v) for v in raw_cusps]
    # Swiss Ephemeris style can return 13 entries where index 0 is empty.
    if len(cusps) >= 13:
        selected = cusps[1:13]
    else:
        selected = cusps[:12]
    if len(selected) != 12:
        raise RuntimeError("expected 12 house cusps from ephemeris")
    return [_normalize_deg(v) for v in selected]


def _to_sign(longitude: float) -> tuple[str, int, float]:
    normalized = _normalize_deg(longitude)
    sign_index = int(normalized // 30)
    degree_in_sign = normalized - (sign_index * 30.0)
    return _SIGNS[sign_index], sign_index, degree_in_sign


def _normalize_deg(value: float) -> float:
    normalized = value % 360.0
    if normalized < 0:
        return normalized + 360.0
    return normalized


def _angular_distance(a: float, b: float) -> float:
    delta = abs(_normalize_deg(a) - _normalize_deg(b))
    return delta if delta <= 180.0 else 360.0 - delta


def _build_aspects(planets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    aspects: list[dict[str, Any]] = []
    for i in range(len(planets)):
        for j in range(i + 1, len(planets)):
            p1 = planets[i]
            p2 = planets[j]
            dist = _angular_distance(float(p1["longitude"]), float(p2["longitude"]))

            for aspect_name, angle, max_orb in _ASPECTS:
                orb = abs(dist - angle)
                if orb <= max_orb:
                    aspects.append(
                        {
                            "p1": p1["key"],
                            "p2": p2["key"],
                            "type": aspect_name,
                            "angle": angle,
                            "orb": round(orb, 6),
                            "distance": round(dist, 6),
                        }
                    )
                    break

    aspects.sort(key=lambda item: (item["orb"], item["type"], item["p1"], item["p2"]))
    return aspects


ephemeris_service = SwissEphemerisService()
