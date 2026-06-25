from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models import user_db
from app.models.company_db import Company
from app.models.employee_db import Employee
from app.models.employee import EmployeeCreate, EmployeeUpdate
from app.models.department_db import Department
from app.models.department_transfer_db import DepartmentTransfer
from app.models.department_transfer_schema import DepartmentTransferCreate
from app.models.notification_db import Notification
from fastapi import HTTPException

def normalize_company_name(name: str) -> str:
    """
    Normalizes the company name string for consistent queries.
    """
    """
    Normalize a company name for consistent string comparison.
    """
    return name.strip().lower()


def clone_source_employees_to_global_tech(db: Session, target_company_id: int):
    """
    Utility function to clone employees from a source company to 'Global Tech'.
    """
    """
    Ensure the 'Global Tech' company contains cloned employees from a source company ('Corp' or 'Company Inc').
    Syncs the employee list so that the demo environment for Global Tech has consistent data.
    """
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
    """
    Fetches a list of all employees belonging to the specified company.
    """
    """
    Retrieve all employees for a given company.
    Calls a synchronization function for the 'Global Tech' company beforehand.
    """
    clone_source_employees_to_global_tech(db, company_id)
    return db.query(Employee).filter(Employee.company_id == company_id).all()

def get_employee_by_id(db: Session, employee_id: int, company_id: int):
    """
    Retrieves the details of a specific employee by their ID.
    """
    """
    Fetch a specific employee by ID, ensuring they belong to the provided company.
    """
    employee = db.query(Employee).filter(Employee.id == employee_id, Employee.company_id == company_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

def create_employee(db: Session, employee: EmployeeCreate, company_id: int, actor_id: int):
    """
    Creates a new employee record and associates it with a company.
    """
    """
    Create a new employee record.
    Logs an audit event after successful creation.
    """
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
    """
    Updates an existing employee's information.
    """
    """
    Update an existing employee's details.
    Only provided fields are updated, and an audit log records the modified fields.
    """
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
    """
    Removes an employee record from the database.
    """
    """
    Delete an employee record by their ID.
    Logs an audit event for the deletion action.
    """
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

def transfer_employee(db: Session, employee_id: int, transfer_data: DepartmentTransferCreate, company_id: int, actor_id: int):
    """
    Initiates a department transfer for a specific employee.
    """
    """
    Transfer an employee from their current department to a new one.
    Records the transfer history, creates an audit log, and notifies the employee.
    """
    db_employee = db.query(Employee).filter(Employee.id == employee_id, Employee.company_id == company_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    from_dept_id = db_employee.department_id
    to_dept_id = transfer_data.to_department_id

    if from_dept_id == to_dept_id:
        raise HTTPException(status_code=400, detail="Employee is already in this department")

    to_dept = db.query(Department).filter(Department.id == to_dept_id).first()
    if not to_dept:
        raise HTTPException(status_code=404, detail="Target department not found")

    from_dept = None
    if from_dept_id:
        from_dept = db.query(Department).filter(Department.id == from_dept_id).first()

    db_employee.department_id = to_dept_id

    transfer_record = DepartmentTransfer(
        employee_id=employee_id,
        from_department_id=from_dept_id,
        to_department_id=to_dept_id,
        actor_id=actor_id,
        reason=transfer_data.reason
    )
    db.add(transfer_record)
    
    if db_employee.email:
        notification_msg = f"Your department has been changed to {to_dept.name}."
        if transfer_data.reason:
            notification_msg += f" Reason: {transfer_data.reason}"
        notification = Notification(
            user_email=db_employee.email,
            message=notification_msg,
            type="department_transfer"
        )
        db.add(notification)

    from app.controllers.audit_controller import create_audit_log
    from_dept_name = from_dept.name if from_dept else "None"
    create_audit_log(
        db,
        "Employee Transferred",
        f"Employee '{db_employee.name}' transferred from '{from_dept_name}' to '{to_dept.name}' by user {actor_id}",
        actor_id,
        company_id,
    )

    db.commit()
    db.refresh(db_employee)
    return db_employee

def get_department_transfers_by_employee(db: Session, employee_id: int, company_id: int):
    """
    Retrieves the department transfer history for a given employee.
    """
    """
    Retrieve the department transfer history for a specific employee.
    Joins with department and user details to provide meaningful names.
    """
    db_employee = db.query(Employee).filter(Employee.id == employee_id, Employee.company_id == company_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    transfers = db.query(DepartmentTransfer).filter(DepartmentTransfer.employee_id == employee_id).order_by(DepartmentTransfer.transfer_date.desc()).all()
    
    result = []
    for t in transfers:
        from_dept = db.query(Department).filter(Department.id == t.from_department_id).first()
        to_dept = db.query(Department).filter(Department.id == t.to_department_id).first()
        actor = db.query(user_db.User).filter(user_db.User.id == t.actor_id).first()
        
        result.append({
            "id": t.id,
            "employee_id": t.employee_id,
            "from_department_id": t.from_department_id,
            "to_department_id": t.to_department_id,
            "from_department_name": from_dept.name if from_dept else None,
            "to_department_name": to_dept.name if to_dept else None,
            "actor_id": t.actor_id,
            "actor_name": actor.name if actor else None,
            "reason": t.reason,
            "transfer_date": t.transfer_date
        })
    return result