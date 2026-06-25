from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.employee_db import Employee
from app.models.department_db import Department
from app.models.role_request_db import RoleRequest
from app.models.user_db import User


def get_analytics_summary(db: Session, company_id: int):
    """
    Retrieves a comprehensive analytics summary for the company, including attendance rates and user statistics.
    """
    """
    Retrieve an analytics summary for the dashboard.
    Returns total and active employees, department count, pending role requests,
    and breakdowns by department, role, and status.
    """
    total_employees = db.query(func.count(Employee.id)).filter(Employee.company_id == company_id).scalar() or 0
    active_employees = (
        db.query(func.count(Employee.id))
        .filter(Employee.company_id == company_id, Employee.status == "Active")
        .scalar()
        or 0
    )
    total_departments = db.query(func.count(Department.id)).scalar() or 0
    pending_role_requests = (
        db.query(func.count(RoleRequest.id))
        .join(User, User.id == RoleRequest.user_id)
        .filter(RoleRequest.status == "Pending", User.company_id == company_id)
        .scalar()
        or 0
    )

    employees_by_department_rows = (
        db.query(func.coalesce(Department.name, "Unassigned"), func.count(Employee.id))
        .outerjoin(Department, Employee.department_id == Department.id)
        .filter(Employee.company_id == company_id)
        .group_by(Department.name)
        .all()
    )

    employees_by_role_rows = (
        db.query(Employee.role, func.count(Employee.id))
        .filter(Employee.company_id == company_id)
        .group_by(Employee.role)
        .all()
    )

    status_overview_rows = (
        db.query(Employee.status, func.count(Employee.id))
        .filter(Employee.company_id == company_id)
        .group_by(Employee.status)
        .all()
    )

    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "total_departments": total_departments,
        "pending_role_requests": pending_role_requests,
        "employees_by_department": [
            {"label": label or "Unassigned", "count": count} for label, count in employees_by_department_rows
        ],
        "employees_by_role": [
            {"label": role or "Unknown", "count": count} for role, count in employees_by_role_rows
        ],
        "employee_status_overview": [
            {"label": status or "Unknown", "count": count} for status, count in status_overview_rows
        ],
    }
