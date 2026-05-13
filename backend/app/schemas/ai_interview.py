from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class BaziInterviewStartRequest(BaseModel):
    profile_id: str = Field(min_length=1, max_length=36)
    system_payload: dict[str, Any] = Field(
        validation_alias=AliasChoices("system_payload", "bazi_payload"),
        serialization_alias="system_payload",
    )
    target_section: str | None = Field(default=None, pattern="^(career|love|wealth|health)$")


class InterviewQuestionPayload(BaseModel):
    section: str
    section_label: str
    section_index: int
    question_index: int
    question_number_in_section: int
    question_number_total: int
    question: str
    options: list[dict[str, str]]


class BaziInterviewSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str
    profile_id: str
    status: str
    scope_type: str
    target_section: str | None = None
    current_section_index: int
    current_question_index: int
    total_sections: int
    questions_per_section: int
    total_questions: int
    answered_count: int
    current_question: InterviewQuestionPayload | None
    completed_at: datetime | None = None
    final_summary: dict[str, Any] | None = None


class BaziInterviewAnswerRequest(BaseModel):
    option_key: str = Field(pattern="^[ABCD]$")
    option_text: str = Field(min_length=1, max_length=400)


class BaziInterviewAnswerFeedbackResponse(BaziInterviewSessionResponse):
    feedback: str


class BaziInterviewExportResponse(BaseModel):
    session_id: str
    profile_id: str
    status: str
    markdown: str
    final_summary: dict[str, Any] | None
