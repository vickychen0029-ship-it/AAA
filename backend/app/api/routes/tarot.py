from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.tarot import TarotInterpretRequest, TarotInterpretResponse
from app.services.tarot_reading import build_tarot_reading


router = APIRouter(tags=["tarot"])


@router.post("/tarot/interpret", response_model=TarotInterpretResponse)
def interpret_tarot(
    payload: TarotInterpretRequest,
    _: User = Depends(get_current_user),
) -> TarotInterpretResponse:
    cards = [
        {
            "position": card.position,
            "key": card.key,
            "name": card.name,
            "orientation": card.orientation,
            "base_meaning": card.base_meaning,
        }
        for card in payload.cards
    ]
    result = build_tarot_reading(payload.question, cards)
    return TarotInterpretResponse(**result)


@router.post("/ai-interview/tarot/interpret", response_model=TarotInterpretResponse)
def interpret_tarot_legacy_path(
    payload: TarotInterpretRequest,
    user: User = Depends(get_current_user),
) -> TarotInterpretResponse:
    return interpret_tarot(payload, user)
