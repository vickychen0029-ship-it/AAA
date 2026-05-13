from __future__ import annotations

from datetime import UTC

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import (
    ProfileCreateRequest,
    ProfileListResponse,
    ProfileResponse,
    ProfileUpdateRequest,
)
from app.services.geocoding import geocode_location
from app.services.time_normalization import normalize_birth_time


router = APIRouter(tags=["profiles"])

FREE_PROFILES_LIMIT = 10


def _to_profile_response(item: Profile) -> ProfileResponse:
    birth_local_dt = item.birth_local_dt or item.created_at.replace(tzinfo=None)
    if item.birth_utc_dt is None:
        birth_utc_dt = item.created_at
    else:
        birth_utc_dt = item.birth_utc_dt if item.birth_utc_dt.tzinfo is not None else item.birth_utc_dt.replace(tzinfo=UTC)

    return ProfileResponse(
        id=item.id,
        name=item.nickname,
        gender=item.gender,
        location_query=item.birth_place or "",
        current_place=item.current_place,
        iana_tz=item.iana_tz or "UTC",
        lat=float(item.latitude or 0.0),
        lng=float(item.longitude or 0.0),
        birth_local_dt=birth_local_dt,
        birth_utc_dt=birth_utc_dt,
        dst_auto=item.dst_auto,
        dst_applied=item.dst_applied,
    )


@router.post("/profiles", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    payload: ProfileCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    current_total = db.scalar(select(func.count()).select_from(Profile).where(Profile.user_id == current_user.id)) or 0
    if current_total >= FREE_PROFILES_LIMIT:
        # TODO: replace with user/account-plan-aware quota check.
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"free tier allows up to {FREE_PROFILES_LIMIT} profiles",
        )

    lat = payload.lat
    lng = payload.lng
    resolved_tz = payload.iana_tz

    if lat is None or lng is None or not resolved_tz:
        geocoded = geocode_location(payload.location_query)
        lat = geocoded.lat if lat is None else lat
        lng = geocoded.lng if lng is None else lng
        resolved_tz = resolved_tz or geocoded.iana_tz

    if lat is None or lng is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="could not resolve coordinates from profile payload",
        )

    if not resolved_tz:
        # TODO: replace with lat/lng -> IANA timezone provider lookup.
        resolved_tz = "UTC"

    try:
        normalized = normalize_birth_time(
            birth_local_dt=payload.birth_local_dt,
            iana_tz=resolved_tz,
            dst_auto=payload.dst_auto,
            dst_applied=payload.dst_applied,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    profile = Profile(
        user_id=current_user.id,
        nickname=payload.name,
        gender=payload.gender,
        birth_place=payload.location_query,
        current_place=payload.current_place,
        iana_tz=normalized.iana_tz,
        latitude=lat,
        longitude=lng,
        birth_local_dt=normalized.birth_local_dt.replace(tzinfo=None),
        birth_utc_dt=normalized.birth_utc_dt.astimezone(UTC),
        dst_auto=normalized.dst_auto,
        dst_applied=normalized.dst_applied,
        dst_mode="auto" if payload.dst_auto else "manual",
        is_dst=normalized.dst_applied,
        geo={"lat": lat, "lng": lng, "provider_tz": normalized.iana_tz},
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return _to_profile_response(profile)


@router.get("/profiles", response_model=ProfileListResponse)
def list_profiles(
    limit: int = Query(default=10, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProfileListResponse:
    if limit > FREE_PROFILES_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"free tier max limit is {FREE_PROFILES_LIMIT}",
        )

    items = db.scalars(
        select(Profile)
        .where(Profile.user_id == current_user.id)
        .order_by(Profile.created_at.desc())
        .limit(limit)
    ).all()
    total = db.scalar(select(func.count()).select_from(Profile).where(Profile.user_id == current_user.id)) or 0
    return ProfileListResponse(items=[_to_profile_response(item) for item in items], limit=limit, total=total)


@router.get("/profiles/{id}", response_model=ProfileResponse)
def get_profile(
    id: str = Path(min_length=1, max_length=36),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    profile = db.scalar(select(Profile).where(Profile.id == id, Profile.user_id == current_user.id))
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"profile not found: {id}")
    return _to_profile_response(profile)


@router.put("/profiles/{id}", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    id: str = Path(min_length=1, max_length=36),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    profile = db.scalar(select(Profile).where(Profile.id == id, Profile.user_id == current_user.id))
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"profile not found: {id}")

    data = payload.model_dump(exclude_unset=True)

    if "name" in data:
        profile.nickname = data["name"]
    if "gender" in data:
        profile.gender = data["gender"]
    if "current_place" in data:
        profile.current_place = data["current_place"]
    if "location_query" in data:
        profile.birth_place = data["location_query"]

    need_recompute = any(
        k in data
        for k in ("birth_local_dt", "dst_auto", "dst_applied", "iana_tz", "lat", "lng", "location_query")
    )

    if need_recompute:
        birth_local_dt = data.get("birth_local_dt")
        if birth_local_dt is None:
            if profile.birth_local_dt is None:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="birth_local_dt is required")
            birth_local_dt = profile.birth_local_dt

        dst_auto = data.get("dst_auto", profile.dst_auto)
        dst_applied = data.get("dst_applied", profile.dst_applied)
        lat = data.get("lat", profile.latitude)
        lng = data.get("lng", profile.longitude)
        resolved_tz = data.get("iana_tz", profile.iana_tz)
        location_query = data.get("location_query", profile.birth_place or "")

        if lat is None or lng is None or not resolved_tz:
            try:
                geocoded = geocode_location(location_query)
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
            lat = geocoded.lat if lat is None else lat
            lng = geocoded.lng if lng is None else lng
            resolved_tz = resolved_tz or geocoded.iana_tz

        if lat is None or lng is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="could not resolve coordinates from profile payload",
            )

        if not resolved_tz:
            resolved_tz = "UTC"

        try:
            normalized = normalize_birth_time(
                birth_local_dt=birth_local_dt,
                iana_tz=resolved_tz,
                dst_auto=dst_auto,
                dst_applied=dst_applied,
            )
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

        profile.iana_tz = normalized.iana_tz
        profile.latitude = float(lat)
        profile.longitude = float(lng)
        profile.birth_local_dt = normalized.birth_local_dt.replace(tzinfo=None)
        profile.birth_utc_dt = normalized.birth_utc_dt.astimezone(UTC)
        profile.dst_auto = normalized.dst_auto
        profile.dst_applied = normalized.dst_applied
        profile.dst_mode = "auto" if normalized.dst_auto else "manual"
        profile.is_dst = normalized.dst_applied
        profile.geo = {"lat": float(lat), "lng": float(lng), "provider_tz": normalized.iana_tz}

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return _to_profile_response(profile)


@router.delete("/profiles/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    id: str = Path(min_length=1, max_length=36),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    profile = db.scalar(select(Profile).where(Profile.id == id, Profile.user_id == current_user.id))
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"profile not found: {id}")
    db.delete(profile)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
