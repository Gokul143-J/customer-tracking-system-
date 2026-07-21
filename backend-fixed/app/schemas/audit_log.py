import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class AuditLogBase(BaseModel):
    action: str = Field(..., max_length=50)
    entity_type: str = Field(..., max_length=50)
    entity_id: uuid.UUID | None = None
    old_values: dict[str, Any] | None = None
    new_values: dict[str, Any] | None = None
    ip_address: str | None = Field(None, max_length=45)
    user_agent: str | None = Field(None, max_length=500)


class AuditLogCreate(AuditLogBase):
    user_id: uuid.UUID | None = None


class AuditLogInDBBase(AuditLogBase):
    id: uuid.UUID
    user_id: uuid.UUID | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLog(AuditLogInDBBase):
    pass
