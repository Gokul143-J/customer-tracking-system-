"""
Jewellery CRM - API Dependencies
==================================
Reusable FastAPI dependencies: DB session, current user, RBAC checks.
"""

import uuid
from typing import AsyncGenerator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.security import decode_token
from app.db.session import async_session_factory
from app.models.user import User
from app.models.role import Role

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async DB session with auto commit/rollback."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Get the current authenticated user from a JWT token.
    Raises 401 if token is missing/invalid or user is inactive.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token subject")

    user = await db.scalar(
        select(User)
        .options(selectinload(User.role))
        .where(User.id == user_id)
    )
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


def require_permission(resource: str, action: str):
    """
    Dependency factory that enforces RBAC.
    Usage: @router.get("/", dependencies=[Depends(require_permission("tickets","read"))])
    """

    async def _checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> None:
        # Eager-load role if not already loaded
        if current_user.role is None:
            role = await db.get(Role, current_user.role_id)
        else:
            role = current_user.role
        if role is None:
            raise HTTPException(status_code=403, detail="No role assigned to user")
        if not role.has_permission(resource, action):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: {action} on {resource}",
            )

    return _checker


async def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Like get_current_user but returns None instead of raising 401 (for demo/optional auth)."""
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    user_id_str = payload.get("sub")
    if not user_id_str:
        return None
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        return None
    user = await db.scalar(
        select(User).options(selectinload(User.role)).where(User.id == user_id)
    )
    if user and user.is_active:
        return user
    return None
