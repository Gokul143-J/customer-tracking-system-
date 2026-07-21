"""
Jewellery CRM — Models Package.

All SQLAlchemy ORM models are imported here to ensure they are
registered with Base.metadata for Alembic migrations and table creation.
"""

from app.models.role import Role  # noqa: F401
from app.models.store import Store  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.customer import Customer  # noqa: F401
from app.models.ticket import Ticket  # noqa: F401
from app.models.section import Section  # noqa: F401
from app.models.movement import MovementHistory  # noqa: F401
from app.models.sale import Sale  # noqa: F401
from app.models.invoice import Invoice  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.setting import Setting  # noqa: F401

__all__ = [
    "Role",
    "Store",
    "User",
    "Customer",
    "Ticket",
    "Section",
    "MovementHistory",
    "Sale",
    "Invoice",
    "Product",
    "Notification",
    "AuditLog",
    "Setting",
]
