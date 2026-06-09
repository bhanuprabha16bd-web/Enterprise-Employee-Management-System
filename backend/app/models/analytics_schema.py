from pydantic import BaseModel

class AnalyticsCountItem(BaseModel):
    label: str
    count: int

class AnalyticsSummary(BaseModel):
    total_employees: int
    active_employees: int
    total_departments: int
    pending_role_requests: int
    employees_by_department: list[AnalyticsCountItem]
    employees_by_role: list[AnalyticsCountItem]
    employee_status_overview: list[AnalyticsCountItem]
