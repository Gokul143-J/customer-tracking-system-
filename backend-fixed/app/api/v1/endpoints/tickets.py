"""
Ticket endpoints: create ticket, list tickets, retrieve ticket with movements.
Generates QR + barcode images for each new ticket.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.customer import Customer
from app.models.movement import MovementHistory
from app.models.store import Store
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.customer import CustomerCreate
from app.schemas.movement import MovementHistory as MovementSchema
from app.schemas.ticket import TicketBase, TicketWithCustomer
from app.services.audit_service import write_audit
from app.services.ticket_service import generate_ticket_codes

router = APIRouter()


class TicketCreateRequest(BaseModel):
    customer: CustomerCreate
    ticket: TicketBase


@router.post(
    "/",
    response_model=TicketWithCustomer,
    status_code=status.HTTP_201_CREATED,
)
async def create_ticket(
    payload: TicketCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Any:
    """
    Create a new ticket for a customer.
    If a customer with the given phone exists, their visit_count is incremented.
    Otherwise a new Customer record is created.
    QR and barcode images are generated and stored as base64 data URIs.
    """
    # Get-or-create customer
    customer = await db.scalar(
        select(Customer).where(Customer.phone == payload.customer.phone)
    )
    if customer:
        customer.visit_count += 1
        customer.last_visit = datetime.now(timezone.utc)
        # Update mutable fields with provided data
        new_data = payload.customer.model_dump(exclude_unset=True)
        for k, v in new_data.items():
            if v not in (None, ""):
                setattr(customer, k, v)
    else:
        customer = Customer(**payload.customer.model_dump())
        db.add(customer)
    # flush (not commit) so customer.id is available, but everything is
    # committed atomically together with the ticket at the end —
    # if ticket creation fails we don't leave an orphaned customer behind.
    await db.flush()
    await db.refresh(customer)

    # Determine creator/store
    if current_user:
        user_id = current_user.id
        store_id = current_user.store_id
    else:
        # Demo fallback
        store = await db.scalar(select(Store).limit(1))
        user = await db.scalar(select(User).limit(1))
        if not store or not user:
            raise HTTPException(status_code=500, detail="Database not seeded")
        user_id, store_id = user.id, store.id

    # Generate a unique ticket number (continue from the highest existing
    # number for this year — never resets, so no duplicate collisions)
    year = datetime.now(timezone.utc).year
    prefix = f"JR-{year}-"
    last_number = await db.scalar(
        select(func.max(Ticket.ticket_number)).where(
            Ticket.ticket_number.like(f"{prefix}%")
        )
    )
    if last_number:
        try:
            next_seq = int(last_number.rsplit("-", 1)[-1]) + 1
        except ValueError:
            next_seq = 1001
    else:
        next_seq = 1001
    ticket_number = f"{prefix}{next_seq:05d}"

    qr_b64, bc_b64 = generate_ticket_codes(ticket_number)

    data = payload.ticket.model_dump(exclude_unset=True)
    # Set initial section to 'reception' if not provided
    data.setdefault("current_section", "reception")
    data.setdefault("status", "ACTIVE")
    # Interested_products from payload
    if "interested_products" not in data:
        data["interested_products"] = []

    ticket = Ticket(
        id=uuid.uuid4(),
        ticket_number=ticket_number,
        customer_id=customer.id,
        store_id=store_id,
        created_by=user_id,
        qr_code=qr_b64,
        barcode=bc_b64,
        **data,
    )
    db.add(ticket)

    # Record an initial movement from '' to reception
    movement = MovementHistory(
        id=uuid.uuid4(),
        ticket_id=ticket.id,
        customer_id=customer.id,
        from_section="entry",
        to_section="reception",
        assigned_by=user_id,
        time_spent_seconds=0,
    )
    db.add(movement)

    await db.commit()
    await db.refresh(ticket)

    await write_audit(
        db,
        action="create",
        entity_type="ticket",
        entity_id=ticket.id,
        user_id=user_id,
        new_values={"ticket_number": ticket_number},
        ip_address=request.client.host if request.client else None,
    )

    # Reload with customer for response
    ticket = await db.scalar(
        select(Ticket)
        .options(selectinload(Ticket.customer), selectinload(Ticket.movements))
        .where(Ticket.id == ticket.id)
    )
    return ticket


@router.get("/", response_model=list[TicketWithCustomer])
async def list_tickets(
    status_filter: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Any:
    """List tickets. Optional status filter (ACTIVE, CLOSED, COMPLETED, etc.)."""
    query = select(Ticket).options(selectinload(Ticket.customer))
    if status_filter:
        query = query.where(Ticket.status == status_filter.upper())
    if current_user:
        query = query.where(Ticket.store_id == current_user.store_id)
    query = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit)
    result = await db.scalars(query)
    return result.all()


@router.get("/{ticket_identifier}", response_model=TicketWithCustomer)
async def get_ticket(
    ticket_identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Any:
    """
    Get a ticket by either its ticket_number (e.g. JR-2026-01001)
    or by UUID. Looks up by UUID first, falls back to ticket_number.
    """
    query = select(Ticket).options(
        selectinload(Ticket.customer),
        selectinload(Ticket.movements),
        selectinload(Ticket.sale),
    )
    try:
        uid = uuid.UUID(ticket_identifier)
        query = query.where(Ticket.id == uid)
    except ValueError:
        query = query.where(Ticket.ticket_number == ticket_identifier)

    ticket = await db.scalar(query)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.get("/by-number/{ticket_number}", response_model=TicketWithCustomer)
async def get_ticket_by_number(
    ticket_number: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Convenience endpoint to look up a ticket by exact number."""
    ticket = await db.scalar(
        select(Ticket)
        .options(selectinload(Ticket.customer), selectinload(Ticket.movements))
        .where(Ticket.ticket_number == ticket_number)
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.get("/{ticket_identifier}/movements", response_model=list[MovementSchema])
async def get_ticket_movements(
    ticket_identifier: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get movement history for a ticket."""
    # Resolve ticket
    query = select(Ticket)
    try:
        uid = uuid.UUID(ticket_identifier)
        query = query.where(Ticket.id == uid)
    except ValueError:
        query = query.where(Ticket.ticket_number == ticket_identifier)
    ticket = await db.scalar(query)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    movements = await db.scalars(
        select(MovementHistory)
        .where(MovementHistory.ticket_id == ticket.id)
        .order_by(MovementHistory.created_at.asc())
    )
    return movements.all()


class TicketCloseRequest(BaseModel):
    reason: str | None = None  # no_purchase_reason or note


@router.post("/{ticket_identifier}/close", response_model=TicketWithCustomer)
async def close_ticket(
    ticket_identifier: str,
    payload: TicketCloseRequest | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Any:
    """Mark a ticket as closed (no purchase)."""
    query = select(Ticket).options(selectinload(Ticket.customer))
    try:
        uid = uuid.UUID(ticket_identifier)
        query = query.where(Ticket.id == uid)
    except ValueError:
        query = query.where(Ticket.ticket_number == ticket_identifier)
    ticket = await db.scalar(query)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status != "ACTIVE":
        raise HTTPException(status_code=400, detail=f"Ticket already {ticket.status}")

    previous_section = ticket.current_section or "reception"
    ticket.status = "CLOSED"
    ticket.current_section = "exit"
    ticket.closed_at = datetime.now(timezone.utc)
    if payload and payload.reason:
        ticket.no_purchase_reason = payload.reason

    # Record final movement (exit)
    movement = MovementHistory(
        id=uuid.uuid4(),
        ticket_id=ticket.id,
        customer_id=ticket.customer_id,
        from_section=previous_section,
        to_section="exit",
        assigned_by=current_user.id if current_user else None,
        time_spent_seconds=0,
    )
    db.add(movement)
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket
