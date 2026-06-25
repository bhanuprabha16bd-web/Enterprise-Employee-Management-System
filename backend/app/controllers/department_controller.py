from sqlalchemy.orm import Session
from app.models.department_db import Department
from app.models.employee import DepartmentCreate
from fastapi import HTTPException

def get_all_departments(db: Session):
    """
    Retrieves a list of all departments within the system.
    """
    """
    Retrieve a list of all departments from the database.
    """
    return db.query(Department).all()

def create_department(db: Session, department: DepartmentCreate):
    """
    Creates a new department record in the database.
    """
    """
    Create a new department in the database using the provided data.
    """
    db_department = Department(**department.model_dump())
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department
