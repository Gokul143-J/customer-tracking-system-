"""
Sale endpoints: record a purchase and close the ticket.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.invoice import Invoice
from app.models.movement import MovementHistory
from app.models.sale import Sale
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleResponse
from app.services.audit_service import write_audit

router = APIRouter()


@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
async def create_sale(
    sale_in: SaleCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Any:
    """
    Log a sale and close the associated ticket.
    Generates an invoice number, marks the ticket as COMPLETED,
    creates a final movement to billing, and creates a placeholder Invoice.
    """
    ticket = await db.scalar(select(Ticket).where(Ticket.id == sale_in.ticket_id))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status in ("CLOSED", "COMPLETED"):
        raise HTTPException(status_code=400, detail="Ticket already closed")

    salesperson = current_user or (await db.scalar(select(User).limit(1)))
    if not salesperson:
        raise HTTPException(status_code=500, detail="No salesperson available")

    # Generate unique invoice number (continue from highest existing for the year)
    year = datetime.now(timezone.utc).year
    inv_prefix = f"INV-{year}-"
    last_inv = await db.scalar(
        select(func.max(Sale.invoice_number)).where(
            Sale.invoice_number.like(f"{inv_prefix}%")
        )
    )
    if last_inv:
        try:
            next_inv = int(last_inv.rsplit("-", 1)[-1]) + 1
        except ValueError:
            next_inv = 1001
    else:
        next_inv = 1001
    invoice_number = f"{inv_prefix}{next_inv:05d}"

    sale = Sale(
        id=uuid.uuid4(),
        ticket_id=ticket.id,
        customer_id=ticket.customer_id,
        salesperson_id=salesperson.id,
        store_id=ticket.store_id,
        products=sale_in.products,
        total_weight=sale_in.total_weight,
        making_charges=sale_in.making_charges,
        stone_weight=sale_in.stone_weight,
        gst_amount=sale_in.gst_amount,
        discount=sale_in.discount,
        final_amount=sale_in.final_amount,
        payment_method=sale_in.payment_method,
        invoice_number=invoice_number,
        status="completed",
    )
    db.add(sale)

    # Update ticket
    previous_section = ticket.current_section
    ticket.status = "COMPLETED"
    ticket.current_section = "billing"
    ticket.closed_at = datetime.now(timezone.utc)
    db.add(ticket)

    # Movement to billing
    movement = MovementHistory(
        id=uuid.uuid4(),
        ticket_id=ticket.id,
        customer_id=ticket.customer_id,
        from_section=previous_section or "reception",
        to_section="billing",
        assigned_by=salesperson.id,
        time_spent_seconds=0,
    )
    db.add(movement)

    # Placeholder invoice
    invoice = Invoice(
        id=uuid.uuid4(),
        sale_id=sale.id,
        invoice_number=invoice_number,
        status="generated",
        invoice_data={
            "ticket_number": ticket.ticket_number,
            "final_amount": str(sale_in.final_amount),
            "payment_method": sale_in.payment_method,
        },
    )
    db.add(invoice)

    await db.commit()
    await db.refresh(sale)

    await write_audit(
        db,
        action="create",
        entity_type="sale",
        entity_id=sale.id,
        user_id=salesperson.id,
        new_values={"invoice_number": invoice_number, "final_amount": str(sale_in.final_amount)},
        ip_address=request.client.host if request.client else None,
    )
    return sale


@router.get("/", response_model=list[SaleResponse])
async def list_sales(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Any:
    query = select(Sale).order_by(Sale.created_at.desc()).offset(skip).limit(limit)
    if current_user:
        query = query.where(Sale.store_id == current_user.store_id)
    result = await db.scalars(query)
    return result.all()


@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale(
    sale_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    sale = await db.scalar(select(Sale).where(Sale.id == sale_id))
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale
