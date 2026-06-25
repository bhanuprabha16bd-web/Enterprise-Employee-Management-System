from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.controllers import employee_controller
from app.models.employee import EmployeeResponse, EmployeeCreate, EmployeeUpdate
from app.models.department_transfer_schema import DepartmentTransferCreate, DepartmentTransferResponse
from app.database.config import SessionLocal
from app.auth import get_current_user, get_active_user
from typing import List

router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
    dependencies=[Depends(get_active_user)]
)

def get_db():
    """
    Dependency function to provide a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(db: Session = Depends(get_db), current_user = Depends(get_active_user)):
    """
    API Endpoint: Lists all employees.
    """
    return employee_controller.get_all_employees(db, current_user.company_id)

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db), current_user = Depends(get_active_user)):
    """
    API Endpoint: Gets details of a specific employee.
    """
    return employee_controller.get_employee_by_id(db, employee_id, current_user.company_id)

@router.post("/", response_model=EmployeeResponse)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db), current_user = Depends(get_active_user)):
    """
    API Endpoint: Creates a new employee.
    """
    return employee_controller.create_employee(db, employee, current_user.company_id, current_user.id)

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int, employee: EmployeeUpdate, db: Session = Depends(get_db), current_user = Depends(get_active_user)):
    """
    API Endpoint: Updates an employee.
    """
    return employee_controller.update_employee(db, employee_id, employee, current_user.company_id, current_user.id)

@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db), current_user = Depends(get_active_user)):
    """
    API Endpoint: Deletes an employee.
    """
    return employee_controller.delete_employee(db, employee_id, current_user.company_id, current_user.id)

@router.post("/{employee_id}/transfer", response_model=EmployeeResponse)
def transfer_employee(employee_id: int, transfer_data: DepartmentTransferCreate, db: Session = Depends(get_db), current_user = Depends(get_active_user)):
    """
    API Endpoint: Transfers an employee to a new department.
    """
    return employee_controller.transfer_employee(db, employee_id, transfer_data, current_user.company_id, current_user.id)

@router.get("/{employee_id}/transfers", response_model=List[DepartmentTransferResponse])
def get_department_transfers(employee_id: int, db: Session = Depends(get_db), current_user = Depends(get_active_user)):
    """
    API Endpoint: Retrieves employee transfer history.
    """
    return employee_controller.get_department_transfers_by_employee(db, employee_id, current_user.company_id)

