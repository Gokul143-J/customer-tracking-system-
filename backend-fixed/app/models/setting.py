"""
Jewellery CRM — Setting Model
================================
Key-value store for application and store-level settings.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Setting(Base):
    """Key-value settings for store configuration."""

    __tablename__ = "settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    store_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Store this setting belongs to",
    )

    key: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Setting key (e.g., theme, printer_settings, qr_settings)",
    )

    value: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Setting value as JSON",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    store = relationship("Store", back_populates="store_settings", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Setting(key={self.key}, store={self.store_id})>"
