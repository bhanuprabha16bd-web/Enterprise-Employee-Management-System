from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.config import SessionLocal
from app.models.user_db import User
from app.models.holiday_schema import HolidayCreate, HolidayUpdate, HolidayResponse
from app.controllers import holiday_controller
from app.auth import get_current_user, get_active_user

router = APIRouter(prefix="/holidays", tags=["Holidays"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# get_active_user implicitly checks for active status and we can enforce role in controller or here.
# For simplicity, assuming get_active_user gives us a valid user, but we should probably verify if they are Admin.
# Since it's a simple app, let's use get_active_user and handle admin check in controller if needed, or just let get_active_user suffice if it's the standard.
# Let's check how department_routes does it: it uses get_active_user. We'll use get_active_user.

@router.post("/", response_model=HolidayResponse)
def create_holiday(holiday_in: HolidayCreate, db: Session = Depends(get_db), current_user: User = Depends(get_active_user)):
    return holiday_controller.create_holiday(db, holiday_in, current_user)

@router.put("/{holiday_id}", response_model=HolidayResponse)
def update_holiday(holiday_id: int, holiday_in: HolidayUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_active_user)):
    return holiday_controller.update_holiday(db, holiday_id, holiday_in, current_user)

@router.delete("/{holiday_id}")
def delete_holiday(holiday_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_active_user)):
    return holiday_controller.delete_holiday(db, holiday_id, current_user)

@router.get("/today", response_model=Optional[HolidayResponse])
def get_holiday_today(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return holiday_controller.get_holiday_today(db, current_user.company_id)

@router.get("/", response_model=List[HolidayResponse])
def get_holidays(year: Optional[int] = None, month: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return holiday_controller.get_holidays(db, current_user.company_id, year, month)
