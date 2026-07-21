import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CustomerBase(BaseModel):
    name: str = Field(..., max_length=200)
    phone: str = Field(..., max_length=20)
    gender: str = Field(default="", max_length=20)
    age: int | None = Field(default=None, ge=0, le=120)
    city: str = Field(default="", max_length=100)
    purpose: str = Field(default="", max_length=50)
    budget: str = Field(default="", max_length=50)
    remarks: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    name: str | None = Field(None, max_length=200)
    phone: str | None = Field(None, max_length=20)


class CustomerInDBBase(CustomerBase):
    id: uuid.UUID
    visit_count: int
    first_visit: datetime
    last_visit: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Customer(CustomerInDBBase):
    pass
