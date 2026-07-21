"""
Jewellery CRM — Notification Model
=====================================
In-app notifications for users (transfers, alerts, ticket updates).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Notification(Base):
    """In-app notification for a user."""

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="User receiving the notification",
    )

    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="Notification type: transfer, ticket_closed, customer_waiting, alert",
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Notification title",
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Notification body message",
    )

    metadata_json: Mapped[dict | None] = mapped_column(
        "metadata",
        JSON,
        nullable=True,
        comment="Additional metadata (ticket_id, section, etc.)",
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Whether the notification has been read",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="notifications", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Notification(type={self.type}, user={self.user_id})>"
