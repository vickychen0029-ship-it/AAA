from __future__ import annotations

import json
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.ai_interview import AIInterviewSession
from app.models.profile import Profile
from app.models.user import User
from app.schemas.ai_interview import (
    BaziInterviewAnswerRequest,
    BaziInterviewAnswerFeedbackResponse,
    BaziInterviewExportResponse,
    BaziInterviewSessionResponse,
    BaziInterviewStartRequest,
    InterviewQuestionPayload,
)
from app.services.bazi_interview import (
    QUESTIONS_PER_SECTION,
    SECTIONS,
    SYSTEM_LABELS,
    build_answer_feedback,
    build_final_summary,
    build_question_plan,
    next_question,
    step_pointer,
)


router = APIRouter(tags=["ai-interview"])
ALLOWED_SYSTEMS = {"bazi", "zodiac", "ziwei", "vedic"}


def _validate_system_type(system_type: str) -> str:
    value = system_type.strip().lower()
    if value not in ALLOWED_SYSTEMS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"unsupported system_type: {system_type}",
        )
    return value


def _session_label(system_type: str) -> str:
    return SYSTEM_LABELS.get(system_type, "命盘")


def _to_response(session: AIInterviewSession) -> BaziInterviewSessionResponse:
    current = next_question(
        question_plan=session.question_plan,
        current_section_index=session.current_section_index,
        current_question_index=session.current_question_index,
    )
    current_payload = InterviewQuestionPayload(**current) if current else None
    active_sections = [s for s in SECTIONS if s in session.question_plan]
    total_sections = len(active_sections)
    return BaziInterviewSessionResponse(
        session_id=session.id,
        profile_id=session.profile_id,
        status=session.status,
        scope_type=session.scope_type,
        target_section=session.target_section,
        current_section_index=session.current_section_index,
        current_question_index=session.current_question_index,
        total_sections=total_sections,
        questions_per_section=QUESTIONS_PER_SECTION,
        total_questions=total_sections * QUESTIONS_PER_SECTION,
        answered_count=len(session.answers or []),
        current_question=current_payload,
        completed_at=session.completed_at,
        final_summary=session.final_summary,
    )


@router.post(
    "/ai-interview/{system_type}/start",
    response_model=BaziInterviewSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_interview(
    payload: BaziInterviewStartRequest,
    system_type: str = Path(pattern="^(bazi|zodiac|ziwei|vedic)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaziInterviewSessionResponse:
    normalized_system = _validate_system_type(system_type)
    profile = db.scalar(select(Profile).where(Profile.id == payload.profile_id, Profile.user_id == current_user.id))
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"profile not found: {payload.profile_id}")

    plan = build_question_plan(normalized_system, payload.system_payload, payload.target_section)
    now = datetime.now(UTC)
    target_section = payload.target_section if payload.target_section in SECTIONS else None
    session = AIInterviewSession(
        profile_id=payload.profile_id,
        system_type=normalized_system,
        status="in_progress",
        scope_type="section" if target_section else "full",
        target_section=target_section,
        current_section_index=0,
        current_question_index=0,
        question_plan=plan.questions,
        answers=[],
        bazi_payload=payload.system_payload,
        final_summary=None,
        started_at=now,
        completed_at=None,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _to_response(session)


@router.get("/ai-interview/{system_type}/latest/{profile_id}", response_model=BaziInterviewSessionResponse)
def get_latest_interview(
    profile_id: str = Path(min_length=1, max_length=36),
    system_type: str = Path(pattern="^(bazi|zodiac|ziwei|vedic)$"),
    target_section: str | None = Query(default=None, pattern="^(career|love|wealth|health)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaziInterviewSessionResponse:
    normalized_system = _validate_system_type(system_type)
    query = select(AIInterviewSession).where(
        AIInterviewSession.profile_id == profile_id,
        AIInterviewSession.system_type == normalized_system,
    )
    query = query.join(Profile, AIInterviewSession.profile_id == Profile.id).where(Profile.user_id == current_user.id)
    if target_section:
        query = query.where(
            AIInterviewSession.scope_type == "section",
            AIInterviewSession.target_section == target_section,
        )
    session = db.scalar(query.order_by(AIInterviewSession.created_at.desc()))
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"no {normalized_system} interview session found")
    return _to_response(session)


@router.post("/ai-interview/{system_type}/{session_id}/answer", response_model=BaziInterviewAnswerFeedbackResponse)
def submit_interview_answer(
    payload: BaziInterviewAnswerRequest,
    session_id: str = Path(min_length=1, max_length=36),
    system_type: str = Path(pattern="^(bazi|zodiac|ziwei|vedic)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaziInterviewAnswerFeedbackResponse:
    normalized_system = _validate_system_type(system_type)
    session = db.scalar(
        select(AIInterviewSession).join(Profile, AIInterviewSession.profile_id == Profile.id).where(
            AIInterviewSession.id == session_id,
            AIInterviewSession.system_type == normalized_system,
            Profile.user_id == current_user.id,
        )
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"session not found: {session_id}")
    if session.status == "completed":
        return BaziInterviewAnswerFeedbackResponse(**_to_response(session).model_dump(), feedback="该板块已完成。")

    current = next_question(
        question_plan=session.question_plan,
        current_section_index=session.current_section_index,
        current_question_index=session.current_question_index,
    )
    if current is None:
        session.status = "completed"
        session.completed_at = datetime.now(UTC)
        db.add(session)
        db.commit()
        db.refresh(session)
        return BaziInterviewAnswerFeedbackResponse(**_to_response(session).model_dump(), feedback="该板块已完成。")

    if payload.option_key not in {"A", "B", "C", "D"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="option_key must be A/B/C/D")

    answers = list(session.answers or [])
    feedback = build_answer_feedback(
        system_type=normalized_system,
        system_payload=session.bazi_payload or {},
        section=current["section"],
        question=current["question"],
        option_key=payload.option_key,
        option_text=payload.option_text,
    )
    answers.append(
        {
            "answered_at": datetime.now(UTC).isoformat(),
            "section": current["section"],
            "section_label": current["section_label"],
            "question_index": current["question_index"],
            "question_number_in_section": current["question_number_in_section"],
            "question_number_total": current["question_number_total"],
            "question": current["question"],
            "option_key": payload.option_key,
            "option_text": payload.option_text,
            "feedback": feedback,
        }
    )
    session.answers = answers

    next_s, next_q = step_pointer(
        session.current_section_index,
        session.current_question_index,
        session.question_plan,
    )
    session.current_section_index = next_s
    session.current_question_index = next_q

    pending = next_question(
        question_plan=session.question_plan,
        current_section_index=session.current_section_index,
        current_question_index=session.current_question_index,
    )
    if pending is None:
        session.status = "completed"
        session.completed_at = datetime.now(UTC)
        session.final_summary = build_final_summary(
            system_type=normalized_system,
            system_payload=session.bazi_payload or {},
            answers=session.answers or [],
        )

    db.add(session)
    db.commit()
    db.refresh(session)
    return BaziInterviewAnswerFeedbackResponse(**_to_response(session).model_dump(), feedback=feedback)


@router.get("/ai-interview/{system_type}/{session_id}/export", response_model=BaziInterviewExportResponse)
def export_interview(
    session_id: str = Path(min_length=1, max_length=36),
    system_type: str = Path(pattern="^(bazi|zodiac|ziwei|vedic)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaziInterviewExportResponse:
    normalized_system = _validate_system_type(system_type)
    session = db.scalar(
        select(AIInterviewSession).join(Profile, AIInterviewSession.profile_id == Profile.id).where(
            AIInterviewSession.id == session_id,
            AIInterviewSession.system_type == normalized_system,
            Profile.user_id == current_user.id,
        )
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"session not found: {session_id}")

    system_label = _session_label(normalized_system)
    lines = [
        f"# {system_label}AI访谈记录",
        "",
        f"- 体系：{normalized_system}",
        f"- 档案ID：{session.profile_id}",
        f"- 会话ID：{session.id}",
        f"- 状态：{session.status}",
        f"- 开始时间：{session.started_at.isoformat()}",
        f"- 完成时间：{session.completed_at.isoformat() if session.completed_at else '未完成'}",
        "",
        "## 问答记录",
    ]

    for item in session.answers or []:
        section_label = item.get("section_label", "未知板块")
        q_num = item.get("question_number_in_section", "-")
        lines.append(f"### {section_label} 第{q_num}问")
        lines.append(f"Q: {item.get('question', '')}")
        option_key = str(item.get("option_key", "") or "").strip()
        option_text = str(item.get("option_text", "") or "").strip()
        answer_line = f"{option_key}. {option_text}".strip(". ")
        lines.append(f"A: {answer_line}")
        feedback = str(item.get("feedback", "") or "").strip()
        if feedback:
            lines.append(f"AI反馈: {feedback}")
        lines.append("")

    if session.final_summary:
        lines.append("## AI总结")
        lines.append("```json")
        lines.append(json.dumps(session.final_summary, ensure_ascii=False, indent=2))
        lines.append("```")

    markdown = "\n".join(lines)
    return BaziInterviewExportResponse(
        session_id=session.id,
        profile_id=session.profile_id,
        status=session.status,
        markdown=markdown,
        final_summary=session.final_summary,
    )


@router.delete("/ai-interview/{system_type}/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(
    session_id: str = Path(min_length=1, max_length=36),
    system_type: str = Path(pattern="^(bazi|zodiac|ziwei|vedic)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    normalized_system = _validate_system_type(system_type)
    session = db.scalar(
        select(AIInterviewSession).join(Profile, AIInterviewSession.profile_id == Profile.id).where(
            AIInterviewSession.id == session_id,
            AIInterviewSession.system_type == normalized_system,
            Profile.user_id == current_user.id,
        )
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"session not found: {session_id}")
    db.delete(session)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
