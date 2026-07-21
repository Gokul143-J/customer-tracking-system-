"""
Invoice endpoints: create, list, retrieve invoice for a sale.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.models.invoice import Invoice
from app.models.sale import Sale
from app.schemas.invoice import Invoice as InvoiceSchema, InvoiceCreate, InvoiceUpdate

router = APIRouter()


@router.post("/", response_model=InvoiceSchema, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    payload: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Create a new invoice record for a sale."""
    sale = await db.scalar(select(Sale).where(Sale.id == payload.sale_id))
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    existing = await db.scalar(select(Invoice).where(Invoice.sale_id == payload.sale_id))
    if existing:
        raise HTTPException(status_code=400, detail="Invoice already exists for this sale")

    invoice = Invoice(**payload.model_dump())
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.get("/", response_model=list[InvoiceSchema])
async def list_invoices(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.scalars(
        select(Invoice)
        .options(selectinload(Invoice.sale))
        .order_by(Invoice.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.all()


@router.get("/by-number/{invoice_number}", response_model=InvoiceSchema)
async def get_invoice_by_number(
    invoice_number: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    invoice = await db.scalar(
        select(Invoice)
        .options(selectinload(Invoice.sale))
        .where(Invoice.invoice_number == invoice_number)
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.get("/{invoice_id}", response_model=InvoiceSchema)
async def get_invoice(
    invoice_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    invoice = await db.scalar(
        select(Invoice)
        .options(selectinload(Invoice.sale))
        .where(Invoice.id == invoice_id)
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.patch("/{invoice_id}", response_model=InvoiceSchema)
async def update_invoice(
    invoice_id: uuid.UUID,
    payload: InvoiceUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    invoice = await db.scalar(select(Invoice).where(Invoice.id == invoice_id))
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(invoice, k, v)
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice
