"""
Jewellery CRM — Section Model
================================
Represents showroom sections/departments (e.g., Gold Ring, Diamond, Billing).
Sections are store-specific and can be customized by admins.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Section(Base):
    """Showroom section/department."""

    __tablename__ = "sections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="Section identifier (e.g., gold_ring, diamond)",
    )

    display_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Human-readable section name",
    )

    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Order in which sections are displayed",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Whether the section is currently active",
    )

    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Store this section belongs to",
    )

    icon: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Lucide icon name for the section",
    )

    color: Mapped[str | None] = mapped_column(
        String(7),
        nullable=True,
        comment="Hex color code for the section (e.g., #D4AF37)",
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
    store = relationship("Store", back_populates="sections", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Section(name={self.display_name}, store={self.store_id})>"
