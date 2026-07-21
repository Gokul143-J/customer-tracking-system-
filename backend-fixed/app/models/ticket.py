"""
Jewellery CRM — Ticket Model
===============================
Digital ticket generated when a customer enters the showroom.
Tracks the customer's journey status, interested products, and current section.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Ticket(Base):
    """
    Digital showroom ticket.

    Status lifecycle: ACTIVE → COMPLETED / CANCELLED / NO_PURCHASE
    """

    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    ticket_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        comment="Unique ticket number (e.g., JR-2026-001245)",
    )

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="Foreign key to customer",
    )

    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="User who created the ticket (receptionist)",
    )

    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="Store where ticket was issued",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="ACTIVE",
        index=True,
        comment="Ticket status: ACTIVE, COMPLETED, CANCELLED, NO_PURCHASE",
    )

    qr_code: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Base64-encoded QR code image data",
    )

    barcode: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Base64-encoded barcode image data",
    )

    interested_products: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        default=list,
        comment="List of product categories the customer is interested in",
    )

    current_section: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="reception",
        comment="Current section where the customer is located",
    )

    no_purchase_reason: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        comment="Reason for not purchasing (if applicable)",
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Additional notes from sales staff",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when the ticket was closed",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    customer = relationship("Customer", back_populates="tickets", lazy="selectin")
    created_by_user = relationship("User", back_populates="created_tickets", lazy="selectin")
    store = relationship("Store", back_populates="tickets", lazy="selectin")
    movements = relationship(
        "MovementHistory",
        back_populates="ticket",
        lazy="selectin",
        order_by="MovementHistory.created_at",
    )
    sale = relationship("Sale", back_populates="ticket", uselist=False, lazy="selectin")

    def __repr__(self) -> str:
        return f"<Ticket(number={self.ticket_number}, status={self.status})>"
