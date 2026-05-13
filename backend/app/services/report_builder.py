from __future__ import annotations

from typing import Any, Literal


ReportMode = Literal["concise", "standard"]

_ELEMENT_BY_SIGN = {
    "Aries": "fire",
    "Leo": "fire",
    "Sagittarius": "fire",
    "Taurus": "earth",
    "Virgo": "earth",
    "Capricorn": "earth",
    "Gemini": "air",
    "Libra": "air",
    "Aquarius": "air",
    "Cancer": "water",
    "Scorpio": "water",
    "Pisces": "water",
}


def build_natal_report(*, chart_payload: dict[str, Any], mode: ReportMode) -> dict[str, Any]:
    planets = chart_payload.get("planets", [])
    aspects = chart_payload.get("aspects", [])
    houses = chart_payload.get("houses", [])

    sun = _find_planet(planets, "sun")
    moon = _find_planet(planets, "moon")
    asc_sign = houses[0].get("sign") if houses else None

    top_elements = _rank_elements(planets)
    top_aspects = aspects[:3]

    summary = (
        f"Core pattern: Sun in {sun.get('sign', 'Unknown')}, "
        f"Moon in {moon.get('sign', 'Unknown')}, "
        f"Ascendant in {asc_sign or 'Unknown'}."
    )
    if mode == "concise":
        summary = (
            f"Sun {sun.get('sign', 'Unknown')} / "
            f"Moon {moon.get('sign', 'Unknown')} / "
            f"ASC {asc_sign or 'Unknown'}."
        )

    sections = [
        {
            "id": "core_signature",
            "title": "Core Signature",
            "content": _core_signature_text(sun=sun, moon=moon, asc_sign=asc_sign, mode=mode),
        },
        {
            "id": "element_balance",
            "title": "Element Balance",
            "content": _element_text(top_elements=top_elements, mode=mode),
        },
        {
            "id": "aspect_tone",
            "title": "Aspect Tone",
            "content": _aspect_text(aspects=top_aspects, mode=mode),
        },
    ]

    return {
        "mode": mode,
        "summary": summary,
        "sections": sections,
        "highlights": [
            {
                "label": "Sun",
                "value": sun.get("sign", "Unknown"),
            },
            {
                "label": "Moon",
                "value": moon.get("sign", "Unknown"),
            },
            {
                "label": "Ascendant",
                "value": asc_sign or "Unknown",
            },
        ],
        "meta": {
            "planet_count": len(planets),
            "aspect_count": len(aspects),
            "house_count": len(houses),
            "ephemeris_source": chart_payload.get("ephemeris_source", "unknown"),
        },
    }


def _find_planet(planets: list[dict[str, Any]], key: str) -> dict[str, Any]:
    for item in planets:
        if item.get("key") == key:
            return item
    return {}


def _rank_elements(planets: list[dict[str, Any]]) -> list[tuple[str, int]]:
    tally: dict[str, int] = {"fire": 0, "earth": 0, "air": 0, "water": 0}
    for p in planets:
        sign = p.get("sign")
        if not isinstance(sign, str):
            continue
        element = _ELEMENT_BY_SIGN.get(sign)
        if element:
            tally[element] += 1
    ranked = sorted(tally.items(), key=lambda x: (-x[1], x[0]))
    return ranked


def _core_signature_text(
    *,
    sun: dict[str, Any],
    moon: dict[str, Any],
    asc_sign: str | None,
    mode: ReportMode,
) -> str:
    if mode == "concise":
        return (
            f"Identity runs through {sun.get('sign', 'Unknown')}, emotions through "
            f"{moon.get('sign', 'Unknown')}, and your social style starts from {asc_sign or 'Unknown'}."
        )
    return (
        f"Your identity expression is centered in {sun.get('sign', 'Unknown')}, while your emotional baseline "
        f"leans toward {moon.get('sign', 'Unknown')}. With an Ascendant in {asc_sign or 'Unknown'}, people often "
        "first meet your outer rhythm before they discover your deeper motivations."
    )


def _element_text(*, top_elements: list[tuple[str, int]], mode: ReportMode) -> str:
    lead = ", ".join(f"{name}:{count}" for name, count in top_elements)
    if mode == "concise":
        return f"Element weighting -> {lead}."
    return (
        f"Element distribution across major planets is {lead}. Higher-count elements usually indicate the most "
        "available coping style and decision pattern under pressure."
    )


def _aspect_text(*, aspects: list[dict[str, Any]], mode: ReportMode) -> str:
    if not aspects:
        return "No major aspects were detected within default orbs."

    parts = [
        f"{a.get('p1')}-{a.get('p2')} {a.get('type')} (orb {a.get('orb')})"
        for a in aspects
    ]
    if mode == "concise":
        return "Top aspects: " + "; ".join(parts) + "."
    return (
        "The strongest aspect pattern emphasizes "
        + "; ".join(parts)
        + ". Lower orbs typically indicate themes that feel more immediate in lived experience."
    )
