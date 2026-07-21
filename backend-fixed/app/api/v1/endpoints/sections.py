"""
Showroom sections endpoints.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.section import Section
from app.models.store import Store
from app.models.user import User
from app.schemas.user import User as UserSchema  # re-export not needed

router = APIRouter()


class SectionOut(BaseModel):
    id: uuid.UUID
    name: str
    display_name: str
    display_order: int
    is_active: bool
    icon: str | None = None
    color: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SectionCreate(BaseModel):
    name: str = Field(..., max_length=50)
    display_name: str = Field(..., max_length=100)
    display_order: int = 0
    icon: str | None = Field(None, max_length=50)
    color: str | None = Field(None, max_length=7)


@router.get("/", response_model=list[SectionOut])
async def list_sections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """List sections for the current user's store."""
    sections = await db.scalars(
        select(Section)
        .where(Section.store_id == current_user.store_id, Section.is_active == True)  # noqa: E712
        .order_by(Section.display_order.asc())
    )
    return sections.all()


@router.post(
    "/",
    response_model=SectionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_section(
    payload: SectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    section = Section(
        id=uuid.uuid4(),
        store_id=current_user.store_id,
        **payload.model_dump(),
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


@router.patch("/{section_id}", response_model=SectionOut)
async def update_section(
    section_id: uuid.UUID,
    payload: SectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    section = await db.scalar(select(Section).where(Section.id == section_id))
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    if section.store_id != current_user.store_id:
        raise HTTPException(status_code=403, detail="Not your store's section")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(section, k, v)
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section
