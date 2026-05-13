from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.chart import Chart
from app.models.profile import Profile
from app.models.user import User
from app.schemas.chart import NatalChartCreateRequest, NatalChartResponse
from app.services.ephemeris import ephemeris_service


router = APIRouter(tags=["charts"])


@router.post(
    "/charts/natal",
    response_model=NatalChartResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_natal_chart(
    payload: NatalChartCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NatalChartResponse:
    profile = db.scalar(select(Profile).where(Profile.id == payload.profile_id, Profile.user_id == current_user.id))
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"profile not found: {payload.profile_id}",
        )

    try:
        chart_payload = ephemeris_service.compute_natal_chart(
            birth_utc_dt=payload.birth_utc_dt,
            lat=payload.geo.lat,
            lng=payload.geo.lng,
            house_system=payload.house_system,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    chart = Chart(
        profile_id=payload.profile_id,
        chart_type="natal",
        chart_payload=chart_payload,
    )
    db.add(chart)
    db.commit()
    db.refresh(chart)

    return NatalChartResponse.model_validate(chart)


@router.get("/charts/natal/{id}", response_model=NatalChartResponse)
def get_natal_chart(
    id: str = Path(min_length=1, max_length=36),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NatalChartResponse:
    chart = db.scalar(
        select(Chart)
        .join(Profile, Chart.profile_id == Profile.id)
        .where(
            Chart.id == id,
            Chart.chart_type == "natal",
            Profile.user_id == current_user.id,
        )
    )
    if chart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"natal chart not found: {id}",
        )

    return NatalChartResponse.model_validate(chart)
