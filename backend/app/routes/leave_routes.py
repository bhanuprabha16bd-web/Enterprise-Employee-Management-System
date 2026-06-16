from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.config import SessionLocal
from app.models import leave_request_schema, user_db
from app.controllers import leave_controller
from app.auth import get_current_user

router = APIRouter(
    prefix="/leaves",
    tags=["Leaves"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", response_model=leave_request_schema.LeaveRequestResponse)
def create_leave_request(data: leave_request_schema.LeaveRequestCreate, current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return leave_controller.create_leave_request(db, current_user, data)

@router.get("/me", response_model=list[leave_request_schema.LeaveRequestResponse])
def get_my_leaves(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return leave_controller.get_my_leaves(db, current_user)

@router.get("/admin", response_model=list[leave_request_schema.LeaveRequestResponse])
def get_company_leaves(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail="Not authorized")
    return leave_controller.get_company_leaves(db, current_user.company_id)

@router.put("/{leave_id}", response_model=leave_request_schema.LeaveRequestResponse)
def update_leave_status(leave_id: int, data: leave_request_schema.LeaveRequestUpdate, current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return leave_controller.update_leave_status(db, leave_id, data.status, current_user)
