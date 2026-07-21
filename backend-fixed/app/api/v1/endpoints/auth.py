"""
Authentication endpoints: login, refresh-token, me.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.role import Role
from app.models.store import Store
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, UserInfo
from app.schemas.user import User as UserSchema
from app.services.audit_service import write_audit

settings = get_settings()
router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Login with email + password. Returns a JWT access token and basic user info.

    Demo mode: if email doesn't exist, auto-provisions an admin user so the app
    is usable immediately after `init_db`. Existing users must provide correct password.
    """
    user = await db.scalar(
        select(User)
        .options(selectinload(User.role))
        .where(User.email == login_data.email.lower())
    )

    if not user:
        # DEMO MODE: auto-provision user as admin
        admin_role = await db.scalar(select(Role).where(Role.name == "admin"))
        store = await db.scalar(select(Store).limit(1))
        if not admin_role or not store:
            raise HTTPException(
                status_code=500,
                detail="Database not seeded. Run init_db before logging in.",
            )
        user = User(
            id=uuid.uuid4(),
            email=login_data.email.lower(),
            password_hash=hash_password(login_data.password),
            full_name=login_data.email.split("@")[0].capitalize(),
            phone="",
            role_id=admin_role.id,
            store_id=store.id,
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        user = await db.scalar(
            select(User)
            .options(selectinload(User.role))
            .where(User.id == user.id)
        )
    elif not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.add(user)

    claims = {
        "role_id": str(user.role_id),
        "store_id": str(user.store_id),
        "role_name": user.role.name if user.role else None,
    }
    access_token = create_access_token(
        subject=str(user.id),
        extra_claims=claims,
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(subject=str(user.id))

    await write_audit(
        db,
        action="login",
        entity_type="user",
        entity_id=user.id,
        user_id=user.id,
    )

    role_name = user.role.name if user.role else ""
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=role_name,
            store_id=user.store_id,
        ),
    )


@router.post("/login/oauth", response_model=Token, include_in_schema=False)
async def login_oauth(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """OAuth2 password flow endpoint (for Swagger 'Authorize' and client libs)."""
    return await login(
        LoginRequest(email=form_data.username, password=form_data.password),
        db,
    )


@router.get("/me", response_model=UserSchema)
async def get_me(current_user: User = Depends(get_current_user)) -> Any:
    """Return the currently authenticated user."""
    return current_user


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Stateless logout — client discards token. Record audit entry."""
    await write_audit(
        db,
        action="logout",
        entity_type="user",
        entity_id=current_user.id,
        user_id=current_user.id,
    )
    return {"success": True, "message": "Logged out"}
