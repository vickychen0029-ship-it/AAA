from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token, oauth2_scheme
from app.db.session import get_db
from app.models.user import User


DBSession = Session


def get_current_user(db: DBSession = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    subject = payload.get("sub")
    if not subject:
        raise credentials_exception

    user = db.scalar(select(User).where(User.id == subject))
    if user is None:
        # On stateless/ephemeral runtimes (e.g. serverless sqlite), token may outlive user row.
        # Try self-healing from token claims before rejecting.
        phone = payload.get("phone")
        if isinstance(phone, str) and phone.strip():
            existing_by_phone = db.scalar(select(User).where(User.email == phone.strip()))
            if existing_by_phone is not None:
                user = existing_by_phone
            else:
                user = User(
                    id=str(subject),
                    email=phone.strip(),
                    username=payload.get("username") if isinstance(payload.get("username"), str) else None,
                    hashed_password="__external_jwt_only__",
                    is_active=True,
                    is_superuser=bool(payload.get("is_superuser")),
                )
                db.add(user)
                db.commit()
                db.refresh(user)

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    return user


def get_current_superuser(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="superuser required",
        )
    return current_user
