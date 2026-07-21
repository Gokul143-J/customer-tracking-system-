"""
Movement history endpoints: record a customer's transition between sections.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.movement import MovementHistory
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.movement import MovementHistory as MovementSchema
from app.schemas.movement import MovementHistoryCreate
from app.services.audit_service import write_audit

router = APIRouter()


@router.post(
    "/",
    response_model=MovementSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_movement(
    payload: MovementHistoryCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Any:
    """
    Record a customer movement to a new section.
    Automatically calculates time spent in the previous section.
    """
    ticket = await db.scalar(
        select(Ticket).where(Ticket.ticket_number == payload.ticket_number)
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status != "ACTIVE":
        raise HTTPException(status_code=400, detail=f"Ticket is {ticket.status}, cannot move")

    now = datetime.now(timezone.utc)

    # Find last movement or fall back to ticket creation time
    last_movement = await db.scalar(
        select(MovementHistory)
        .where(MovementHistory.ticket_id == ticket.id)
        .order_by(MovementHistory.created_at.desc())
        .limit(1)
    )

    reference_time = None
    if last_movement and last_movement.created_at:
        reference_time = last_movement.created_at
    elif ticket.created_at:
        reference_time = ticket.created_at

    if reference_time is not None:
        # Ensure both are aware datetimes
        if reference_time.tzinfo is None:
            reference_time = reference_time.replace(tzinfo=timezone.utc)
        time_spent = max(0, int((now - reference_time).total_seconds()))
    else:
        time_spent = 0

    movement = MovementHistory(
        id=uuid.uuid4(),
        ticket_id=ticket.id,
        customer_id=ticket.customer_id,
        from_section=ticket.current_section or "reception",
        to_section=payload.to_section,
        assigned_by=current_user.id if current_user else ticket.created_by,
        assigned_to=None,
        reason=payload.reason,
        notes=payload.notes,
        time_spent_seconds=time_spent,
    )

    ticket.current_section = payload.to_section
    ticket.updated_at = now

    # Moving a customer to "exit" means their visit is over —
    # automatically close the ticket so it doesn't stay ACTIVE forever.
    if payload.to_section.lower() == "exit":
        ticket.status = "CLOSED"
        ticket.closed_at = now
        if payload.reason and not ticket.no_purchase_reason:
            ticket.no_purchase_reason = payload.reason

    db.add(movement)
    db.add(ticket)
    await db.commit()
    await db.refresh(movement)

    await write_audit(
        db,
        action="move",
        entity_type="ticket",
        entity_id=ticket.id,
        user_id=current_user.id if current_user else None,
        new_values={"from": movement.from_section, "to": payload.to_section},
        ip_address=request.client.host if request.client else None,
    )
    return movement


@router.get("/", response_model=list[MovementSchema])
async def list_recent_movements(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Any:
    """List the most recent movements across the store."""
    query = select(MovementHistory).order_by(MovementHistory.created_at.desc()).limit(limit)
    result = await db.scalars(query)
    return result.all()
