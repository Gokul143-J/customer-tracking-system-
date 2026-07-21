"""
Jewellery CRM — Customer Model
=================================
Represents a showroom visitor/customer. Tracks visit count,
contact details, and demographic information for analytics.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Customer(Base):
    """Showroom visitor/customer record."""

    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
        comment="Customer full name",
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        unique=True,
        index=True,
        comment="Customer phone number (unique identifier)",
    )

    gender: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="",
        comment="Customer gender (Male/Female/Other)",
    )

    age: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Customer age",
    )

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="",
        comment="Customer city",
    )

    purpose: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="",
        comment="Visit purpose (Wedding/Personal/Gift/Festival)",
    )

    budget: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="",
        comment="Customer budget range",
    )

    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Additional remarks about the customer",
    )

    visit_count: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        comment="Total number of store visits",
    )

    first_visit: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="Timestamp of first store visit",
    )

    last_visit: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment="Timestamp of most recent visit",
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
    tickets = relationship("Ticket", back_populates="customer", lazy="selectin")
    movements = relationship("MovementHistory", back_populates="customer", lazy="selectin")
    sales = relationship("Sale", back_populates="customer", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Customer(name={self.name}, phone={self.phone})>"
