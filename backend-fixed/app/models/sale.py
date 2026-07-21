"""
Jewellery CRM — Sale Model
=============================
Records purchase transactions when a customer completes a buy.
Linked to a ticket and customer, contains all financial details.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Sale(Base):
    """
    Purchase transaction record.
    One sale per ticket — created when the customer completes a purchase.
    """

    __tablename__ = "sales"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    ticket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tickets.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
        index=True,
        comment="Associated ticket",
    )

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="Customer who made the purchase",
    )

    salesperson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="Sales executive who closed the sale",
    )

    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="Store where the sale occurred",
    )

    products: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        default=list,
        comment="List of purchased products with details",
    )

    total_weight: Mapped[Decimal] = mapped_column(
        Numeric(10, 3),
        nullable=False,
        default=Decimal("0.000"),
        comment="Total product weight in grams",
    )

    making_charges: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Total making charges",
    )

    stone_weight: Mapped[Decimal] = mapped_column(
        Numeric(10, 3),
        nullable=False,
        default=Decimal("0.000"),
        comment="Total stone weight in carats",
    )

    gst_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="GST amount",
    )

    discount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Discount amount",
    )

    final_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0.00"),
        comment="Final amount after GST and discount",
    )

    invoice_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
        comment="Unique invoice number",
    )

    payment_method: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="cash",
        comment="Payment method: UPI, Cash, Card, EMI",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="completed",
        index=True,
        comment="Sale status: completed, refunded, partial",
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
    ticket = relationship("Ticket", back_populates="sale", lazy="selectin")
    customer = relationship("Customer", back_populates="sales", lazy="selectin")
    salesperson = relationship("User", lazy="selectin")
    store = relationship("Store", back_populates="sales", lazy="selectin")
    invoice = relationship("Invoice", back_populates="sale", uselist=False, lazy="selectin")

    def __repr__(self) -> str:
        return f"<Sale(invoice={self.invoice_number}, amount={self.final_amount})>"
