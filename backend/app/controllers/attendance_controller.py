from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, date, timezone
from app.models import attendance_log_db, user_db, employee_db, department_db
from app.controllers.audit_controller import create_audit_log

def check_in(db: Session, current_user: user_db.User):
    """
    Records a clock-in event for the current user in the attendance log.
    """
    """
    Handle user check-in.
    Creates a new attendance log for today if one does not already exist.
    Logs an audit event for the action.
    """
    today = date.today()
    existing = db.query(attendance_log_db.AttendanceLog).filter(
        attendance_log_db.AttendanceLog.user_id == current_user.id,
        attendance_log_db.AttendanceLog.date == today
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in today")
        
    log = attendance_log_db.AttendanceLog(
        user_id=current_user.id,
        company_id=current_user.company_id,
        date=today,
        check_in_time=datetime.now(timezone.utc),
        status="Present"
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    create_audit_log(db, "Check-In", f"User '{current_user.email}' checked in", current_user.id, current_user.company_id)
    return log

def check_out(db: Session, current_user: user_db.User):
    """
    Records a clock-out event for the current user and updates the total hours worked.
    """
    """
    Handle user check-out.
    Finds today's check-in record and sets the check-out time.
    Calculates total hours worked and logs an audit event.
    """
    today = date.today()
    log = db.query(attendance_log_db.AttendanceLog).filter(
        attendance_log_db.AttendanceLog.user_id == current_user.id,
        attendance_log_db.AttendanceLog.date == today
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="No check-in found for today")
        
    if log.check_out_time:
        raise HTTPException(status_code=400, detail="Already checked out today")
        
    check_out_time = datetime.now(timezone.utc)
    check_in_time = log.check_in_time
    if check_in_time.tzinfo is None:
        check_in_time = check_in_time.replace(tzinfo=timezone.utc)

    log.check_out_time = check_out_time
    
    # Check if today is a holiday. If so, working hours should not be calculated.
    from app.controllers.holiday_controller import get_holiday_today
    holiday = get_holiday_today(db, current_user.company_id)
    
    if holiday:
        log.total_hours = 0
    else:
        diff = check_out_time - check_in_time
        log.total_hours = round(diff.total_seconds() / 3600, 2)
    
    db.commit()
    db.refresh(log)
    create_audit_log(db, "Check-Out", f"User '{current_user.email}' checked out after {log.total_hours} hours", current_user.id, current_user.company_id)
    return log

def get_today_status(db: Session, current_user: user_db.User):
    """
    Fetches the user's attendance status (e.g. checked-in, checked-out) for the current day.
    """
    """
    Retrieve the attendance status (log) for the current user for today.
    """
    today = date.today()
    log = db.query(attendance_log_db.AttendanceLog).filter(
        attendance_log_db.AttendanceLog.user_id == current_user.id,
        attendance_log_db.AttendanceLog.date == today
    ).first()
    return log

def get_my_history(db: Session, current_user: user_db.User, limit: int = 30):
    """
    Retrieves the attendance history for the logged-in user, limited to a certain number of records.
    """
    """
    Fetch the attendance history for the current user, limited to the specified number of records.
    """
    logs = db.query(attendance_log_db.AttendanceLog).filter(
        attendance_log_db.AttendanceLog.user_id == current_user.id
    ).order_by(attendance_log_db.AttendanceLog.date.desc()).limit(limit).all()
    return logs

def get_all_attendance(db: Session, company_id: int):
    """
    Fetches the attendance records for all employees within the given company.
    """
    """
    Retrieve all attendance logs for a given company.
    Includes related user, employee, and department information.
    """
    # Use outerjoin for all relations so deleted users' logs are still retained
    logs = (
        db.query(attendance_log_db.AttendanceLog, user_db.User, employee_db.Employee, department_db.Department)
        .outerjoin(user_db.User, user_db.User.id == attendance_log_db.AttendanceLog.user_id)
        .outerjoin(employee_db.Employee, employee_db.Employee.email == user_db.User.email)
        .outerjoin(department_db.Department, department_db.Department.id == employee_db.Employee.department_id)
        .filter(attendance_log_db.AttendanceLog.company_id == company_id)
        .order_by(attendance_log_db.AttendanceLog.date.desc(), attendance_log_db.AttendanceLog.check_in_time.desc())
        .all()
    )
    
    result = []
    for log, user, emp, dept in logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "company_id": log.company_id,
            "date": log.date,
            "check_in_time": log.check_in_time,
            "check_out_time": log.check_out_time,
            "total_hours": log.total_hours,
            "status": log.status,
            "created_at": log.created_at,
            "user_name": emp.name if emp else (user.name if user else "Deleted User"),
            "department": dept.name if dept else "Unassigned"
        }
        result.append(log_dict)
    return result
