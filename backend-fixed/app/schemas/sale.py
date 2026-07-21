import uuid
from typing import Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class SaleBase(BaseModel):
    ticket_id: uuid.UUID
    products: list[dict[str, Any]] | None = None
    total_weight: Decimal = Field(default=Decimal("0.000"))
    making_charges: Decimal = Field(default=Decimal("0.00"))
    stone_weight: Decimal = Field(default=Decimal("0.000"))
    gst_amount: Decimal = Field(default=Decimal("0.00"))
    discount: Decimal = Field(default=Decimal("0.00"))
    final_amount: Decimal = Field(default=Decimal("0.00"))
    payment_method: str = "cash"

class SaleCreate(SaleBase):
    pass

class SaleResponse(SaleBase):
    id: uuid.UUID
    customer_id: uuid.UUID
    salesperson_id: uuid.UUID
    store_id: uuid.UUID
    invoice_number: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
