import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: str = Field(..., max_length=255)
    full_name: str = Field(..., max_length=200)
    phone: str = Field(default="", max_length=20)
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role_id: uuid.UUID
    store_id: uuid.UUID


class UserUpdate(BaseModel):
    email: Optional[str] = Field(None, max_length=255)
    full_name: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    password: Optional[str] = Field(None, min_length=6)
    is_active: Optional[bool] = None
    role_id: Optional[uuid.UUID] = None


class UserInDBBase(UserBase):
    id: uuid.UUID
    role_id: uuid.UUID
    store_id: uuid.UUID
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class User(UserInDBBase):
    pass
