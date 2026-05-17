from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, Request

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.tarot import TarotInterpretResponse
from app.services.tarot_reading import build_tarot_reading


router = APIRouter(tags=["tarot"])


def _extract_payload_from_query(payload: dict[str, Any], request: Request) -> dict[str, Any]:
    question = str(request.query_params.get("question", "") or "").strip()
    cards_raw = str(request.query_params.get("cards", "") or "").strip()
    if question:
        payload["question"] = question
    if cards_raw:
        try:
            parsed = json.loads(cards_raw)
            if isinstance(parsed, list):
                payload["cards"] = parsed
        except Exception:
            pass
    return payload


@router.api_route("/tarot/interpret", methods=["POST", "GET"], response_model=TarotInterpretResponse)
async def interpret_tarot(
    request: Request,
    _: User = Depends(get_current_user),
) -> TarotInterpretResponse:
    payload: dict[str, Any] = {}
    try:
        raw_payload = await request.json()
        if isinstance(raw_payload, dict):
            payload = raw_payload
    except Exception:
        payload = {}
    if request.method == "GET":
        payload = _extract_payload_from_query(payload, request)

    raw_cards = payload.get("cards") if isinstance(payload, dict) else None
    question = str((payload or {}).get("question", "")).strip() if isinstance(payload, dict) else ""
    positions = ["过去", "现在", "未来"]
    cards: list[dict[str, str]] = []

    if isinstance(raw_cards, list):
        for idx, card in enumerate(raw_cards[:3]):
            if not isinstance(card, dict):
                continue
            orientation = str(card.get("orientation", "正位")).strip()
            if orientation not in {"正位", "逆位"}:
                orientation = "正位"
            cards.append(
                {
                    "position": str(card.get("position", positions[idx] if idx < len(positions) else "位置")).strip()
                    or (positions[idx] if idx < len(positions) else "位置"),
                    "key": str(card.get("key", "")).strip() or "unknown",
                    "name": str(card.get("name", "")).strip() or "未知牌",
                    "orientation": orientation,
                    "base_meaning": str(card.get("base_meaning", "")).strip() or "请结合现实场景做谨慎判断。",
                }
            )

    while len(cards) < 3:
        idx = len(cards)
        cards.append(
            {
                "position": positions[idx],
                "key": "unknown",
                "name": "未知牌",
                "orientation": "正位",
                "base_meaning": "请结合现实场景做谨慎判断。",
            }
        )

    result = build_tarot_reading(question, cards[:3])
    return TarotInterpretResponse(**result)


@router.api_route("/ai-interview/tarot/interpret", methods=["POST", "GET"], response_model=TarotInterpretResponse)
async def interpret_tarot_legacy_path(
    request: Request,
    user: User = Depends(get_current_user),
) -> TarotInterpretResponse:
    return await interpret_tarot(request, user)
