"""
Jewellery CRM — Invoice Model
================================
Stores generated invoice documents linked to sales.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Invoice(Base):
    """Invoice document linked to a sale transaction."""

    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    sale_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sales.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        comment="Associated sale",
    )

    invoice_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
        comment="Invoice number (mirrors sale invoice_number)",
    )

    pdf_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="URL or path to the generated PDF invoice",
    )

    invoice_data: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Complete invoice data snapshot for PDF regeneration",
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="generated",
        comment="Invoice status: generated, sent, paid, cancelled",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    sale = relationship("Sale", back_populates="invoice", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Invoice(number={self.invoice_number})>"
