import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.customer import Customer


class TicketBase(BaseModel):
    status: str = Field(default="ACTIVE", max_length=20)
    interested_products: list[str] = Field(default_factory=list)
    current_section: str = Field(default="reception", max_length=50)
    no_purchase_reason: str | None = Field(default=None, max_length=200)
    notes: str | None = None


class TicketCreate(TicketBase):
    customer_id: uuid.UUID
    # Bypassing strict user auth for now: we'll hardcode or pass these in the endpoint
    created_by: uuid.UUID | None = None
    store_id: uuid.UUID | None = None


class TicketUpdate(TicketBase):
    status: str | None = Field(None, max_length=20)
    current_section: str | None = Field(None, max_length=50)


class TicketInDBBase(TicketBase):
    id: uuid.UUID
    ticket_number: str
    customer_id: uuid.UUID
    created_by: uuid.UUID | None
    store_id: uuid.UUID | None
    qr_code: str | None
    barcode: str | None
    created_at: datetime
    closed_at: datetime | None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Ticket(TicketInDBBase):
    pass


class TicketWithCustomer(Ticket):
    customer: Customer
