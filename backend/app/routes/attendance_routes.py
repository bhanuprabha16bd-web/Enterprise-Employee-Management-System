from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.config import SessionLocal
from app.models import attendance_log_schema, user_db
from app.controllers import attendance_controller
from app.auth import get_current_user

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/check-in", response_model=attendance_log_schema.AttendanceLogResponse)
def check_in(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return attendance_controller.check_in(db, current_user)

@router.put("/check-out", response_model=attendance_log_schema.AttendanceLogResponse)
def check_out(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return attendance_controller.check_out(db, current_user)

@router.get("/me/today", response_model=attendance_log_schema.AttendanceLogResponse | None)
def get_today_status(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return attendance_controller.get_today_status(db, current_user)

@router.get("/me/history", response_model=list[attendance_log_schema.AttendanceLogResponse])
def get_my_history(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return attendance_controller.get_my_history(db, current_user)

@router.get("/admin", response_model=list[attendance_log_schema.AttendanceLogResponse])
def get_all_attendance(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    return attendance_controller.get_all_attendance(db, current_user.company_id)
