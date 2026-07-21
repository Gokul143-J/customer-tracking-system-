"""
Jewellery CRM — Product Model
================================
Master catalog of product categories available in the store.
Used for interested products tracking and sales reporting.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Product(Base):
    """Product category in the store catalog."""

    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        comment="Product category name (e.g., Gold Ring, Diamond Necklace)",
    )

    display_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        comment="Human-readable product name",
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="",
        index=True,
        comment="Product category (Gold, Diamond, Silver, Platinum)",
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Product description",
    )

    icon: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Lucide icon name",
    )

    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Display ordering",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Whether the product category is active",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Product(name={self.name}, category={self.category})>"
