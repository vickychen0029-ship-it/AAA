from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.chart import Chart
from app.models.profile import Profile
from app.models.report import Report
from app.models.user import User
from app.schemas.report import NatalReportCreateRequest, NatalReportResponse
from app.services.ephemeris import ephemeris_service
from app.services.report_builder import build_natal_report


router = APIRouter(tags=["reports"])


@router.post(
    "/reports/natal",
    response_model=NatalReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_natal_report(
    payload: NatalReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NatalReportResponse:
    profile = db.scalar(select(Profile).where(Profile.id == payload.profile_id, Profile.user_id == current_user.id))
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"profile not found: {payload.profile_id}",
        )

    chart: Chart | None = None
    if payload.chart_id:
        chart = db.scalar(
            select(Chart).where(
                Chart.id == payload.chart_id,
                Chart.profile_id == payload.profile_id,
                Chart.chart_type == "natal",
            )
        )
        if chart is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"natal chart not found: {payload.chart_id}",
            )

    chart_payload = payload.chart_payload
    chart_id = payload.chart_id

    if chart_payload is None and chart is not None:
        chart_payload = chart.chart_payload

    if chart_payload is None:
        latest_chart = db.scalar(
            select(Chart)
            .where(Chart.profile_id == payload.profile_id, Chart.chart_type == "natal")
            .order_by(Chart.created_at.desc())
        )
        if latest_chart is not None:
            chart_payload = latest_chart.chart_payload
            chart_id = latest_chart.id

    if chart_payload is None:
        if profile.birth_date is None or profile.birth_hour is None or profile.birth_minute is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="profile birth_date, birth_hour and birth_minute are required when chart_id/chart_payload is missing",
            )

        if not profile.geo or "lat" not in profile.geo or "lng" not in profile.geo:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="profile geo.lat and geo.lng are required when chart_id/chart_payload is missing",
            )

        from datetime import UTC, datetime

        birth_utc_dt = datetime(
            year=profile.birth_date.year,
            month=profile.birth_date.month,
            day=profile.birth_date.day,
            hour=profile.birth_hour,
            minute=profile.birth_minute,
            tzinfo=UTC,
        )

        try:
            chart_payload = ephemeris_service.compute_natal_chart(
                birth_utc_dt=birth_utc_dt,
                lat=float(profile.geo["lat"]),
                lng=float(profile.geo["lng"]),
                house_system="P",
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

        new_chart = Chart(
            profile_id=payload.profile_id,
            chart_type="natal",
            chart_payload=chart_payload,
        )
        db.add(new_chart)
        db.flush()
        chart_id = new_chart.id

    if not isinstance(chart_payload, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="chart_payload must be a JSON object",
        )

    result_payload = build_natal_report(chart_payload=chart_payload, mode=payload.mode)

    report = Report(
        profile_id=payload.profile_id,
        chart_id=chart_id,
        report_type="natal",
        input_payload={
            "mode": payload.mode,
            "ephemeris_source": chart_payload.get("ephemeris_source", "unknown"),
        },
        result_payload=result_payload,
        status="completed",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return NatalReportResponse.model_validate(report)
