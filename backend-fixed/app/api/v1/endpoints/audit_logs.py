"""
Audit log endpoints (read-only for authorized users).
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLog as AuditLogSchema

router = APIRouter()


@router.get("/", response_model=list[AuditLogSchema])
async def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    entity_type: str | None = None,
    action: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    query = select(AuditLog)
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if action:
        query = query.where(AuditLog.action == action)
    query = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.scalars(query)
    return result.all()


@router.get("/{log_id}", response_model=AuditLogSchema)
async def get_audit_log(
    log_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    log = await db.scalar(select(AuditLog).where(AuditLog.id == log_id))
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return log
