"""
User management endpoints (admin only).
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, require_permission
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate

router = APIRouter()


@router.get(
    "/",
    response_model=list[UserSchema],
    dependencies=[Depends(require_permission("users", "read"))],
)
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(
        select(User).options(selectinload(User.role)).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.post(
    "/",
    response_model=UserSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("users", "create"))],
)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    existing = await db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    user = User(
        id=uuid.uuid4(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone or "",
        role_id=payload.role_id,
        store_id=payload.store_id,
        is_active=payload.is_active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # Users can view their own profile; admins can view any
    if str(current_user.id) != str(user_id):
        # Require read permission if viewing others
        deps = require_permission("users", "read")
        await deps(current_user=current_user)  # type: ignore[arg-type]

    user = await db.scalar(
        select(User).options(selectinload(User.role)).where(User.id == user_id)
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch(
    "/{user_id}",
    response_model=UserSchema,
    dependencies=[Depends(require_permission("users", "update"))],
)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    data = payload.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        data["password_hash"] = hash_password(data.pop("password"))
    else:
        data.pop("password", None)
    if "email" in data and data["email"]:
        data["email"] = data["email"].lower()

    for k, v in data.items():
        setattr(user, k, v)

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
