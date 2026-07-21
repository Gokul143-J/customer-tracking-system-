"""
Store endpoints: list stores for the admin UI (store dropdowns, multi-showroom).
"""

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.store import Store
from app.models.user import User

router = APIRouter()


class StoreSchema(BaseModel):
    id: uuid.UUID
    name: str
    address: str = ""
    phone: str = ""
    email: str = ""
    gst_number: str = ""
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=list[StoreSchema])
async def list_stores(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Any:
    """List all stores."""
    result = await db.execute(select(Store).order_by(Store.name))
    return result.scalars().all()
