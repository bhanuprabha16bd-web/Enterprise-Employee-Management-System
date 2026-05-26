from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.controllers import employee_controller
from app.models.employee import EmployeeResponse, EmployeeCreate, EmployeeUpdate
from app.database.config import SessionLocal
from app.auth import get_current_user
from typing import List

router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
    dependencies=[Depends(get_current_user)]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(db: Session = Depends(get_db)):
    return employee_controller.get_all_employees(db)

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    return employee_controller.get_employee_by_id(db, employee_id)

@router.post("/", response_model=EmployeeResponse)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    return employee_controller.create_employee(db, employee)

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int, employee: EmployeeUpdate, db: Session = Depends(get_db)):
    return employee_controller.update_employee(db, employee_id, employee)

@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    return employee_controller.delete_employee(db, employee_id)
