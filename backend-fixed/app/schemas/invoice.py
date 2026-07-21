import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class InvoiceBase(BaseModel):
    invoice_number: str = Field(..., max_length=30)
    pdf_url: str | None = None
    invoice_data: dict[str, Any] | None = None
    status: str = Field(default="generated", max_length=20)


class InvoiceCreate(InvoiceBase):
    sale_id: uuid.UUID


class InvoiceUpdate(BaseModel):
    pdf_url: str | None = None
    invoice_data: dict[str, Any] | None = None
    status: str | None = Field(None, max_length=20)


class InvoiceInDBBase(InvoiceBase):
    id: uuid.UUID
    sale_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Invoice(InvoiceInDBBase):
    pass
