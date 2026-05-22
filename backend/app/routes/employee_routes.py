from fastapi import APIRouter
from app.controllers import employee_controller
from app.models.employee import Employee
from typing import List

router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)

@router.get("/", response_model=List[Employee])
def get_employees():
    return employee_controller.get_all_employees()

@router.get("/{employee_id}", response_model=Employee)
def get_employee(employee_id: int):
    return employee_controller.get_employee_by_id(employee_id)
