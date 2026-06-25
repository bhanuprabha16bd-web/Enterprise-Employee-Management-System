from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import leave_request_db, leave_request_schema, user_db, employee_db, department_db
from app.controllers.audit_controller import create_audit_log

def create_leave_request(db: Session, current_user: user_db.User, data: leave_request_schema.LeaveRequestCreate):
    """
    Submits a new leave/time-off request for the current user.
    """
    """
    Create a new leave request for the current user.
    Status is initially set to 'Pending'. Also logs the action.
    """
    req = leave_request_db.LeaveRequest(
        user_id=current_user.id,
        company_id=current_user.company_id,
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason,
        status="Pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    create_audit_log(db, "Leave Request Submitted", f"User '{current_user.email}' requested a {data.leave_type} leave", current_user.id, current_user.company_id)
    return req

def get_my_leaves(db: Session, current_user: user_db.User):
    """
    Fetches all leave requests submitted by the currently logged-in user.
    """
    """
    Retrieve all leave requests submitted by the current user.
    """
    return db.query(leave_request_db.LeaveRequest).filter(
        leave_request_db.LeaveRequest.user_id == current_user.id
    ).order_by(leave_request_db.LeaveRequest.created_at.desc()).all()

def get_company_leaves(db: Session, company_id: int):
    """
    Retrieves all leave requests across the company for administrative review.
    """
    """
    Retrieve all leave requests for the company.
    Includes details about the associated user, employee, and department.
    """
    logs = (
        db.query(leave_request_db.LeaveRequest, user_db.User, employee_db.Employee, department_db.Department)
        .join(user_db.User, user_db.User.id == leave_request_db.LeaveRequest.user_id)
        .outerjoin(employee_db.Employee, employee_db.Employee.email == user_db.User.email)
        .outerjoin(department_db.Department, department_db.Department.id == employee_db.Employee.department_id)
        .filter(leave_request_db.LeaveRequest.company_id == company_id)
        .order_by(leave_request_db.LeaveRequest.created_at.desc())
        .all()
    )
    
    result = []
    for req, user, emp, dept in logs:
        req_dict = {
            "id": req.id,
            "user_id": req.user_id,
            "company_id": req.company_id,
            "leave_type": req.leave_type,
            "start_date": req.start_date,
            "end_date": req.end_date,
            "reason": req.reason,
            "status": req.status,
            "created_at": req.created_at,
            "user_name": user.name,
            "department": dept.name if dept else "Unassigned"
        }
        result.append(req_dict)
    return result

def update_leave_status(db: Session, leave_id: int, status: str, current_user: user_db.User):
    """
    Approves, rejects, or modifies the status of a specific leave request.
    """
    """
    Update the status (e.g., Approved, Rejected) of a leave request.
    Only accessible by Admin users. Logs the update event.
    """
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail="Only Admins can update leave status")
        
    req = db.query(leave_request_db.LeaveRequest).filter(
        leave_request_db.LeaveRequest.id == leave_id,
        leave_request_db.LeaveRequest.company_id == current_user.company_id
    ).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    req.status = status
    db.commit()
    db.refresh(req)
    
    user = db.query(user_db.User).filter(user_db.User.id == req.user_id).first()
    target_email = user.email if user else "Unknown User"
    
    event_type = f"Leave Request {status}"
    desc = f"Admin '{current_user.email}' {status.lower()} {req.leave_type} leave request for '{target_email}'"
    create_audit_log(db, event_type, desc, current_user.id, current_user.company_id)
    
    return req
