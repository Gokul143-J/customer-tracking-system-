"""
Jewellery CRM — Movement History Model
=========================================
Records every customer transfer between showroom sections.
This forms the complete customer journey timeline.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MovementHistory(Base):
    """
    Records a single movement/transfer of a customer between sections.
    The complete journey is reconstructed by querying all movements for a ticket.
    """

    __tablename__ = "movement_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    ticket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Ticket being tracked",
    )

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Customer being moved",
    )

    from_section: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Section the customer is moving from",
    )

    to_section: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Section the customer is moving to",
    )

    assigned_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="User who initiated the transfer",
    )

    assigned_to: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Salesperson assigned at the destination section",
    )

    reason: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        comment="Reason for the transfer",
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Additional notes about the movement",
    )

    time_spent_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Time spent in the previous section (in seconds)",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    ticket = relationship("Ticket", back_populates="movements", lazy="selectin")
    customer = relationship("Customer", back_populates="movements", lazy="selectin")
    assigned_by_user = relationship(
        "User",
        foreign_keys=[assigned_by],
        lazy="selectin",
    )
    assigned_to_user = relationship(
        "User",
        foreign_keys=[assigned_to],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Movement(ticket={self.ticket_id}, {self.from_section} → {self.to_section})>"
