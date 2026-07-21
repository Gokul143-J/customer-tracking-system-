from typing import Any
from pydantic import BaseModel

class MetricWidget(BaseModel):
    label: str
    value: str
    trend: str | None = None
    is_positive: bool | None = None

class SectionOccupancy(BaseModel):
    section: str
    count: int

class RecentActivity(BaseModel):
    id: str
    ticket_number: str
    customer_name: str
    action: str
    timestamp: str

class AnalyticsDashboard(BaseModel):
    metrics: list[MetricWidget]
    occupancy: list[SectionOccupancy]
    recent_activity: list[RecentActivity]
