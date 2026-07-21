"""
Customer CRUD endpoints.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import Customer as CustomerSchema
from app.schemas.customer import CustomerCreate, CustomerUpdate

router = APIRouter()


@router.get("/", response_model=list[CustomerSchema])
async def list_customers(
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    query = select(Customer)
    if search:
        like = f"%{search}%"
        query = query.where(or_(Customer.name.ilike(like), Customer.phone.ilike(like)))
    query = query.order_by(Customer.last_visit.desc()).offset(skip).limit(limit)
    result = await db.scalars(query)
    return result.all()


@router.post(
    "/",
    response_model=CustomerSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_customer(
    payload: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    existing = await db.scalar(select(Customer).where(Customer.phone == payload.phone))
    if existing:
        raise HTTPException(status_code=409, detail="Customer with this phone already exists")
    customer = Customer(**payload.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerSchema)
async def get_customer(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    customer = await db.scalar(select(Customer).where(Customer.id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/by-phone/{phone}", response_model=CustomerSchema)
async def get_customer_by_phone(
    phone: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    customer = await db.scalar(select(Customer).where(Customer.phone == phone))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.patch("/{customer_id}", response_model=CustomerSchema)
async def update_customer(
    customer_id: uuid.UUID,
    payload: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    customer = await db.scalar(select(Customer).where(Customer.id == customer_id))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(customer, k, v)
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer
