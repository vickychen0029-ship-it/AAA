from __future__ import annotations

from pydantic import BaseModel, Field


class TarotInterpretCardRequest(BaseModel):
    position: str = Field(min_length=1, max_length=16)
    key: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=32)
    orientation: str = Field(pattern="^(正位|逆位)$")
    base_meaning: str = Field(min_length=1, max_length=300)


class TarotInterpretRequest(BaseModel):
    question: str = Field(default="", max_length=500)
    cards: list[TarotInterpretCardRequest] = Field(min_length=3, max_length=3)


class TarotInterpretCardResponse(BaseModel):
    position: str
    name: str
    orientation: str
    analysis: str


class TarotInterpretResponse(BaseModel):
    provider: str
    overall: str
    cards: list[TarotInterpretCardResponse]
