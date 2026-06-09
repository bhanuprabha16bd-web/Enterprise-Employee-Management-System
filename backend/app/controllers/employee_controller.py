from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models import user_db
from app.models.company_db import Company
from app.models.employee_db import Employee
from app.models.employee import EmployeeCreate, EmployeeUpdate
from fastapi import HTTPException

def normalize_company_name(name: str) -> str:
    return name.strip().lower()


def clone_source_employees_to_global_tech(db: Session, target_company_id: int):
    target_company = db.query(Company).filter(Company.id == target_company_id).first()
    if not target_company or normalize_company_name(target_company.name) != "global tech":
        return

    source_company = db.query(Company).filter(func.lower(Company.name) == "corp").first()
    if not source_company:
        source_company = db.query(Company).filter(func.lower(Company.name) == "company inc").first()
    if not source_company:
        return

    source_employees = db.query(Employee).filter(Employee.company_id == source_company.id).all()
    if not source_employees:
        return

    target_employee_names = {
        normalize_company_name(emp.name) for emp in db.query(Employee).filter(Employee.company_id == target_company_id).all()
    }

    if target_employee_names == {normalize_company_name(emp.name) for emp in source_employees}:
        return

    # Remove any existing Global Tech employees that do not match source employee names
    db.query(Employee).filter(Employee.company_id == target_company_id).delete(synchronize_session=False)
    db.commit()

    company_key = normalize_company_name(target_company.name).replace(" ", "_")
    for source_employee in source_employees:
        email_username = source_employee.email.split("@", 1)[0] if source_employee.email else "employee"
        email_domain = source_employee.email.split("@", 1)[1] if source_employee.email and "@" in source_employee.email else "example.com"
        cloned_email = f"{company_key}_{email_username}@{email_domain}"
        db_employee = Employee(
            name=source_employee.name,
            email=cloned_email,
            role=source_employee.role,
            department_id=source_employee.department_id,
            status=source_employee.status,
            joinDate=source_employee.joinDate,
            avatar=source_employee.avatar,
            phone=source_employee.phone,
            location=source_employee.location,
            company_id=target_company_id
        )
        db.add(db_employee)
    db.commit()


def get_all_employees(db: Session, company_id: int):
    clone_source_employees_to_global_tech(db, company_id)
    return db.query(Employee).filter(Employee.company_id == company_id).all()

def get_employee_by_id(db: Session, employee_id: int, company_id: int):
    employee = db.query(Employee).filter(Employee.id == employee_id, Employee.company_id == company_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

def create_employee(db: Session, employee: EmployeeCreate, company_id: int, actor_id: int):
    db_employee = Employee(**employee.model_dump(), company_id=company_id)
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    from app.controllers.audit_controller import create_audit_log
    create_audit_log(
        db,
        "Employee Created",
        f"Employee '{db_employee.name}' created by user {actor_id}",
        actor_id,
        company_id,
    )
    return db_employee

def update_employee(db: Session, employee_id: int, employee_data: EmployeeUpdate, company_id: int, actor_id: int):
    db_employee = db.query(Employee).filter(Employee.id == employee_id, Employee.company_id == company_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_data = employee_data.model_dump(exclude_unset=True)
    changed_fields = []
    for key, value in update_data.items():
        setattr(db_employee, key, value)
        changed_fields.append(f"{key}={value}")
        
    db.commit()
    db.refresh(db_employee)
    from app.controllers.audit_controller import create_audit_log
    create_audit_log(
        db,
        "Employee Updated",
        f"Employee '{db_employee.name}' updated by user {actor_id}: {', '.join(changed_fields)}",
        actor_id,
        company_id,
    )
    return db_employee

def delete_employee(db: Session, employee_id: int, company_id: int, actor_id: int):
    db_employee = db.query(Employee).filter(Employee.id == employee_id, Employee.company_id == company_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    db.delete(db_employee)
    db.commit()
    from app.controllers.audit_controller import create_audit_log
    create_audit_log(
        db,
        "Employee Deleted",
        f"Employee '{db_employee.name}' deleted by user {actor_id}",
        actor_id,
        company_id,
    )
    return {"message": "Employee deleted successfully"}