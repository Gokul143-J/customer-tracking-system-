"""
Analytics endpoints for the dashboard.
"""

from datetime import datetime, time, timezone, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.customer import Customer
from app.models.movement import MovementHistory
from app.models.sale import Sale
from app.models.ticket import Ticket
from app.models.user import User
from app.schemas.analytics import AnalyticsDashboard

router = APIRouter()


def _as_float(v: Any) -> float:
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return 0.0


@router.get("/dashboard", response_model=AnalyticsDashboard)
async def get_dashboard_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
) -> Any:
    """
    Live dashboard analytics:
      - Today's visits, active customers, today's revenue, conversion rate
      - Per-section occupancy
      - Last 10 recent activities (ticket creations + movements)
    """
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
    yesterday_start = today_start - timedelta(days=1)

    # Base query scoping to store if authenticated
    def _scope(q):
        if current_user:
            return q.where(Ticket.store_id == current_user.store_id)
        return q

    # Total visits today
    visits_today = await db.scalar(
        _scope(select(func.count()).select_from(Ticket)).where(
            Ticket.created_at >= today_start
        )
    ) or 0

    visits_yesterday = await db.scalar(
        _scope(select(func.count()).select_from(Ticket)).where(
            Ticket.created_at >= yesterday_start,
            Ticket.created_at < today_start,
        )
    ) or 0

    # Active customers (ACTIVE tickets)
    active_customers = await db.scalar(
        _scope(select(func.count()).select_from(Ticket)).where(
            Ticket.status == "ACTIVE"
        )
    ) or 0

    # Today's revenue
    today_revenue = await db.scalar(
        _scope(select(func.coalesce(func.sum(Sale.final_amount), 0)))
        .join(Ticket, Sale.ticket_id == Ticket.id)
        .where(Sale.created_at >= today_start, Sale.status == "completed")
    ) or 0

    # Completed sales today
    sales_today = await db.scalar(
        _scope(select(func.count()).select_from(Sale))
        .join(Ticket, Sale.ticket_id == Ticket.id)
        .where(Sale.created_at >= today_start, Sale.status == "completed")
    ) or 0

    conversion_rate = (sales_today / visits_today * 100) if visits_today else 0.0

    # Visit trend vs yesterday
    if visits_yesterday > 0:
        visit_trend_pct = (visits_today - visits_yesterday) / visits_yesterday * 100
        trend_str = f"{visit_trend_pct:+.1f}%"
    else:
        trend_str = "—"

    # Section occupancy (active tickets per current_section)
    occupancy_q = _scope(
        select(Ticket.current_section, func.count())
        .select_from(Ticket)
        .where(Ticket.status == "ACTIVE")
        .group_by(Ticket.current_section)
    )
    occupancy_result = await db.execute(occupancy_q)
    occupancy = [
        {"section": row[0], "count": int(row[1])} for row in occupancy_result.all()
    ]

    # Recent activity: last 10 tickets
    recent_q = (
        select(Ticket.id, Ticket.ticket_number, Ticket.created_at, Customer.name)
        .join(Customer, Ticket.customer_id == Customer.id)
        .order_by(Ticket.created_at.desc())
        .limit(10)
    )
    if current_user:
        recent_q = recent_q.where(Ticket.store_id == current_user.store_id)
    recent_tickets_result = await db.execute(recent_q)

    recent_activity = []
    for tid, tnum, tcreated_at, cname in recent_tickets_result.all():
        recent_activity.append(
            {
                "id": str(tid),
                "ticket_number": tnum,
                "customer_name": cname,
                "action": "Generated Ticket",
                "timestamp": tcreated_at.isoformat(),
            }
        )

    metrics = [
        {
            "label": "Total Visits Today",
            "value": str(visits_today),
            "trend": trend_str,
            "is_positive": (visits_today >= visits_yesterday),
        },
        {
            "label": "Active Customers",
            "value": str(active_customers),
            "trend": "Live",
            "is_positive": True,
        },
        {
            "label": "Revenue Today",
            "value": f"₹{_as_float(today_revenue):,.2f}",
            "trend": None,
            "is_positive": True,
        },
        {
            "label": "Conversion Rate",
            "value": f"{conversion_rate:.1f}%",
            "trend": f"{sales_today} sales",
            "is_positive": True,
        },
    ]

    return {
        "metrics": metrics,
        "occupancy": occupancy,
        "recent_activity": recent_activity,
    }
