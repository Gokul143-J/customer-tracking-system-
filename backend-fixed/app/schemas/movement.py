import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class MovementHistoryBase(BaseModel):
    from_section: str = Field(..., max_length=50)
    to_section: str = Field(..., max_length=50)
    reason: str | None = Field(None, max_length=200)
    notes: str | None = None
    time_spent_seconds: int = 0


class MovementHistoryCreate(BaseModel):
    ticket_number: str
    to_section: str
    reason: str | None = None
    notes: str | None = None


class MovementHistoryInDBBase(MovementHistoryBase):
    id: uuid.UUID
    ticket_id: uuid.UUID
    customer_id: uuid.UUID
    assigned_by: uuid.UUID | None
    assigned_to: uuid.UUID | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MovementHistory(MovementHistoryInDBBase):
    pass
