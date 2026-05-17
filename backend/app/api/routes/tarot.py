from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Body, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.tarot import TarotInterpretResponse
from app.services.tarot_reading import build_tarot_reading


router = APIRouter(tags=["tarot"])


@router.post("/tarot/interpret", response_model=TarotInterpretResponse)
def interpret_tarot(
    payload: dict[str, Any] = Body(default_factory=dict),
    _: User = Depends(get_current_user),
) -> TarotInterpretResponse:
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


@router.post("/ai-interview/tarot/interpret", response_model=TarotInterpretResponse)
def interpret_tarot_legacy_path(
    payload: dict[str, Any] = Body(default_factory=dict),
    user: User = Depends(get_current_user),
) -> TarotInterpretResponse:
    return interpret_tarot(payload, user)
