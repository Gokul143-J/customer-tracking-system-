from fastapi import APIRouter

from app.api.v1.endpoints import (
    analytics,
    audit_logs,
    auth,
    customers,
    invoices,
    movements,
    roles,
    sales,
    sections,
    stores,
    tickets,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(sections.router, prefix="/sections", tags=["sections"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(movements.router, prefix="/movements", tags=["movements"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit_logs"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(stores.router, prefix="/stores", tags=["stores"])
