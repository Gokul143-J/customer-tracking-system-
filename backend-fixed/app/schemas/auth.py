import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional["UserInfo"] = None


class UserInfo(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    store_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class TokenPayload(BaseModel):
    sub: str
    role_id: Optional[str] = None
    store_id: Optional[str] = None
    type: Optional[str] = None
    exp: Optional[int] = None


# Avoid circular import at module definition time
Token.model_rebuild()
