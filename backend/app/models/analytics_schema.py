from pydantic import BaseModel

class AnalyticsCountItem(BaseModel):
    """
    Pydantic schema representing a count-based analytics metric.
    """
    """
    Represents a generic count item for analytics data, 
    mapping a label to its corresponding count.
    """
    label: str
    count: int

class AnalyticsSummary(BaseModel):
    """
    Pydantic schema representing a comprehensive analytics summary for the dashboard.
    """
    """
    Schema for providing a comprehensive summary of employee and department analytics,
    including detailed aggregations by department, role, and status.
    """
    total_employees: int
    active_employees: int
    total_departments: int
    pending_role_requests: int
    employees_by_department: list[AnalyticsCountItem]
    employees_by_role: list[AnalyticsCountItem]
    employee_status_overview: list[AnalyticsCountItem]
