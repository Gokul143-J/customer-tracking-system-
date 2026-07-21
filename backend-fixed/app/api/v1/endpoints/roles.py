"""
Role endpoints: list roles for the admin UI (role dropdowns, RBAC matrix).
"""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.role import Role
from app.models.user import User

router = APIRouter()


class RoleSchema(BaseModel):
    id: uuid.UUID
    name: str
    display_name: str
    permissions: dict
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=list[RoleSchema])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Any:
    """List all roles with their permission matrices."""
    result = await db.execute(select(Role).order_by(Role.name))
    return result.scalars().all()
