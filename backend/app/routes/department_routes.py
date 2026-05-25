from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.controllers import department_controller
from app.models.employee import DepartmentResponse, DepartmentCreate
from app.database.config import SessionLocal
from typing import List

router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return department_controller.get_all_departments(db)

@router.post("/", response_model=DepartmentResponse)
def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    return department_controller.create_department(db, department)
