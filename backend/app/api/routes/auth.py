from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_superuser, get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserRead


router = APIRouter(tags=["auth"])


def _normalize_phone(phone: str) -> str:
    value = "".join(ch for ch in phone if ch.isdigit())
    if len(value) < 8 or len(value) > 20:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="phone must contain 8-20 digits",
        )
    return value


@router.post("/auth/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    phone = _normalize_phone(payload.email)
    exists = db.scalar(select(User).where(User.email == phone))
    if exists is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="phone already registered")

    user = User(
        email=phone,
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.post("/auth/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    phone = _normalize_phone(form_data.username)
    user = db.scalar(select(User).where(User.email == phone))
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid phone or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="inactive user")

    token = create_access_token(
        subject=user.id,
        extra_claims={
            "phone": user.email,
            "username": user.username,
            "is_superuser": bool(user.is_superuser),
        },
    )
    return Token(access_token=token)


@router.get("/auth/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("/admin/users", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db), _: User = Depends(get_current_superuser)) -> list[UserRead]:
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [UserRead.model_validate(user) for user in users]


@router.patch("/admin/users/{user_id}/active", response_model=UserRead)
def set_user_active(
    user_id: str,
    is_active: bool,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_superuser),
) -> UserRead:
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")
    user.is_active = is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)
