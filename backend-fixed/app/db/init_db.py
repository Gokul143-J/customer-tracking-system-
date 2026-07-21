"""
Jewellery CRM — Database Initialization
=========================================
Handles database table creation and initial data seeding
for first-time setup (default admin, roles, sections, store).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import engine, async_session_factory

# Import all models so Base.metadata is populated
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

settings = get_settings()

# Default roles with their permissions
DEFAULT_ROLES = [
    {
        "name": "admin",
        "display_name": "Admin",
        "permissions": {
            "users": ["create", "read", "update", "delete"],
            "roles": ["create", "read", "update", "delete"],
            "customers": ["create", "read", "update", "delete"],
            "tickets": ["create", "read", "update", "delete", "close"],
            "sections": ["create", "read", "update", "delete"],
            "movements": ["create", "read", "update", "delete"],
            "sales": ["create", "read", "update", "delete"],
            "analytics": ["read"],
            "reports": ["create", "read", "export"],
            "settings": ["read", "update"],
            "notifications": ["read", "create"],
            "audit_logs": ["read"],
        },
    },
    {
        "name": "store_manager",
        "display_name": "Store Manager",
        "permissions": {
            "users": ["create", "read", "update"],
            "customers": ["create", "read", "update"],
            "tickets": ["create", "read", "update", "close"],
            "sections": ["read", "update"],
            "movements": ["create", "read"],
            "sales": ["create", "read", "update"],
            "analytics": ["read"],
            "reports": ["create", "read", "export"],
            "settings": ["read", "update"],
            "notifications": ["read", "create"],
        },
    },
    {
        "name": "floor_manager",
        "display_name": "Floor Manager",
        "permissions": {
            "customers": ["read", "update"],
            "tickets": ["read", "update", "close"],
            "sections": ["read"],
            "movements": ["create", "read"],
            "sales": ["read"],
            "analytics": ["read"],
            "reports": ["read"],
            "notifications": ["read", "create"],
        },
    },
    {
        "name": "sales_executive",
        "display_name": "Sales Executive",
        "permissions": {
            "customers": ["read", "update"],
            "tickets": ["read", "update"],
            "sections": ["read"],
            "movements": ["create", "read"],
            "sales": ["create", "read"],
            "notifications": ["read"],
        },
    },
    {
        "name": "receptionist",
        "display_name": "Receptionist",
        "permissions": {
            "customers": ["create", "read"],
            "tickets": ["create", "read"],
            "sections": ["read"],
            "movements": ["read"],
            "notifications": ["read"],
        },
    },
]

# Default showroom sections
DEFAULT_SECTIONS = [
    {"name": "reception", "display_name": "Reception", "display_order": 1},
    {"name": "gold_ring", "display_name": "Gold Ring", "display_order": 2},
    {"name": "gold_bangle", "display_name": "Gold Bangle", "display_order": 3},
    {"name": "gold_chain", "display_name": "Gold Chain", "display_order": 4},
    {"name": "necklace", "display_name": "Necklace", "display_order": 5},
    {"name": "diamond", "display_name": "Diamond", "display_order": 6},
    {"name": "silver", "display_name": "Silver", "display_order": 7},
    {"name": "platinum", "display_name": "Platinum", "display_order": 8},
    {"name": "billing", "display_name": "Billing", "display_order": 9},
    {"name": "exit", "display_name": "Exit", "display_order": 10},
]


async def create_tables() -> None:
    """Create all database tables from ORM models."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed_default_data() -> None:
    """
    Seed the database with default roles, sections, store, and admin user.
    Only inserts data if the tables are empty (safe to run multiple times).
    """
    async with async_session_factory() as session:
        # Check if roles already exist
        result = await session.execute(select(Role).limit(1))
        if result.scalar_one_or_none() is not None:
            return  # Data already seeded

        # Create default roles
        role_map: dict[str, uuid.UUID] = {}
        for role_data in DEFAULT_ROLES:
            role_id = uuid.uuid4()
            role = Role(
                id=role_id,
                name=role_data["name"],
                display_name=role_data["display_name"],
                permissions=role_data["permissions"],
            )
            session.add(role)
            role_map[role_data["name"]] = role_id

        # Create default store
        store_id = uuid.uuid4()
        store = Store(
            id=store_id,
            name=settings.DEFAULT_STORE_NAME,
            gst_number=settings.DEFAULT_STORE_GST,
            address="",
            phone="",
            email="",
        )
        session.add(store)

        # Create default sections for the store
        for section_data in DEFAULT_SECTIONS:
            section = Section(
                id=uuid.uuid4(),
                name=section_data["name"],
                display_name=section_data["display_name"],
                display_order=section_data["display_order"],
                is_active=True,
                store_id=store_id,
            )
            session.add(section)

        # Create admin user
        admin_user = User(
            id=uuid.uuid4(),
            email=settings.FIRST_ADMIN_EMAIL,
            password_hash=hash_password(settings.FIRST_ADMIN_PASSWORD),
            full_name="System Administrator",
            phone="",
            role_id=role_map["admin"],
            store_id=store_id,
            is_active=True,
        )
        session.add(admin_user)

        await session.commit()


async def init_db() -> None:
    """Initialize the database: create tables and seed default data."""
    await create_tables()
    await seed_default_data()
