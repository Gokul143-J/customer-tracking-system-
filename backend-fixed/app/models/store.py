"""
Jewellery CRM — Store Model
==============================
Represents a physical jewellery store/showroom location.
Supports multi-store deployments where each store has its own
sections, users, and settings.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Store(Base):
    """Physical store/showroom location."""

    __tablename__ = "stores"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Store display name",
    )

    address: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
        comment="Full store address",
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="",
        comment="Store contact phone",
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="",
        comment="Store contact email",
    )

    gst_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="",
        comment="GST registration number",
    )

    logo_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="URL or path to store logo",
    )

    settings: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        default=dict,
        comment="Store-specific settings (theme, printer config, etc.)",
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
        comment="Whether the store is currently active",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    users = relationship("User", back_populates="store", lazy="selectin")
    sections = relationship("Section", back_populates="store", lazy="selectin")
    tickets = relationship("Ticket", back_populates="store", lazy="selectin")
    sales = relationship("Sale", back_populates="store", lazy="selectin")
    store_settings = relationship("Setting", back_populates="store", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Store(name={self.name})>"
