from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, date, timezone
from app.models import attendance_log_db, user_db, employee_db, department_db
from app.controllers.audit_controller import create_audit_log

def check_in(db: Session, current_user: user_db.User):
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
    diff = check_out_time - check_in_time
    log.total_hours = round(diff.total_seconds() / 3600, 2)
    
    db.commit()
    db.refresh(log)
    create_audit_log(db, "Check-Out", f"User '{current_user.email}' checked out after {log.total_hours} hours", current_user.id, current_user.company_id)
    return log

def get_today_status(db: Session, current_user: user_db.User):
    today = date.today()
    log = db.query(attendance_log_db.AttendanceLog).filter(
        attendance_log_db.AttendanceLog.user_id == current_user.id,
        attendance_log_db.AttendanceLog.date == today
    ).first()
    return log

def get_my_history(db: Session, current_user: user_db.User, limit: int = 30):
    logs = db.query(attendance_log_db.AttendanceLog).filter(
        attendance_log_db.AttendanceLog.user_id == current_user.id
    ).order_by(attendance_log_db.AttendanceLog.date.desc()).limit(limit).all()
    return logs

def get_all_attendance(db: Session, company_id: int):
    # Use outerjoin for both employee and department to avoid errors if they are null
    logs = (
        db.query(attendance_log_db.AttendanceLog, user_db.User, employee_db.Employee, department_db.Department)
        .join(user_db.User, user_db.User.id == attendance_log_db.AttendanceLog.user_id)
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
            "user_name": user.name,
            "department": dept.name if dept else "Unassigned"
        }
        result.append(log_dict)
    return result
