"""
Jewellery CRM — Role Model
============================
Defines user roles and their associated permissions.
Each role has a JSON permissions object that maps resources to allowed actions.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, func
from sqlalchemy import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Role(Base):
    """
    Role model for role-based access control (RBAC).

    Permissions are stored as a JSON object:
    {
        "resource_name": ["action1", "action2"],
        ...
    }
    """

    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        comment="Unique role identifier (e.g., admin, receptionist)",
    )

    display_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Human-readable role name",
    )

    permissions: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
        comment="JSON object mapping resources to allowed actions",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    users = relationship("User", back_populates="role", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Role(name={self.name})>"

    def has_permission(self, resource: str, action: str) -> bool:
        """Check if this role has a specific permission on a resource."""
        resource_permissions = self.permissions.get(resource, [])
        return action in resource_permissions
