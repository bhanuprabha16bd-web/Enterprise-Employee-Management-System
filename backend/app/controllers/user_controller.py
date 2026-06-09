from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.controllers.audit_controller import create_audit_log
from app.models import user_db, user_schema, role_request_db

COMPANY_NAME_MAP = {
    "company inc": "Company Inc",
    "corp": "Corp",
    "global tech": "Global Tech"
}
ALLOWED_COMPANY_NAMES_DISPLAY = list(COMPANY_NAME_MAP.values())


def normalize_company_name(name: str) -> str:
    return name.strip()


def canonical_company_name(name: str) -> str | None:
    return COMPANY_NAME_MAP.get(normalize_company_name(name).lower())


def is_allowed_company_name(name: str) -> bool:
    return canonical_company_name(name) is not None

def get_users(db: Session, company_id: int):
    return db.query(user_db.User).filter(user_db.User.company_id == company_id).all()

def get_user(db: Session, user_id: int, company_id: int):
    user = db.query(user_db.User).filter(user_db.User.id == user_id, user_db.User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def create_user(db: Session, user: user_schema.UserCreate):
    from app.auth import get_password_hash
    from app.models.company_db import Company
    
    existing_user = db.query(user_db.User).filter(user_db.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    if user.company_name:
        company_name = canonical_company_name(user.company_name)
    else:
        company_name = "Company Inc"

    if not company_name:
        raise HTTPException(status_code=400, detail=f"Company must be one of: {', '.join(ALLOWED_COMPANY_NAMES_DISPLAY)}")

    company = db.query(Company).filter(func.lower(Company.name) == company_name.lower()).first()
    if not company:
        company = Company(name=company_name)
        db.add(company)
        db.commit()
        db.refresh(company)

    user_data = user.dict()
    password = user_data.pop("password")
    user_data.pop("company_name", None)
    
    user_data["password_hash"] = get_password_hash(password)
    user_data["company_id"] = company.id
    
    new_user = user_db.User(**user_data)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, email: str, password: str):
    from app.auth import verify_password
    user = db.query(user_db.User).filter(user_db.User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def update_user(db: Session, user_id: int, updated_user: user_schema.UserUpdate, company_id: int):
    from app.models.company_db import Company
    user = db.query(user_db.User).filter(user_db.User.id == user_id, user_db.User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    company_name = updated_user.company_name
    if company_name:
        company_name = canonical_company_name(company_name)
        if not company_name:
            raise HTTPException(status_code=400, detail=f"Company must be one of: {', '.join(ALLOWED_COMPANY_NAMES_DISPLAY)}")
        company = db.query(Company).filter(func.lower(Company.name) == company_name.lower()).first()
        if not company:
            company = Company(name=company_name)
            db.add(company)
            db.commit()
            db.refresh(company)
        user.company_id = company.id
        
    user.name = updated_user.name
    user.email = updated_user.email
    user.role = updated_user.role
    user.bio = updated_user.bio
    user.website = updated_user.website
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int, company_id: int):
    user = db.query(user_db.User).filter(user_db.User.id == user_id, user_db.User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

def deactivate_user(db: Session, user_id: int, company_id: int, admin_user: user_db.User):
    user = db.query(user_db.User).filter(user_db.User.id == user_id, user_db.User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status == "Inactive":
        raise HTTPException(status_code=400, detail="User is already inactive")
    user.status = "Inactive"
    db.commit()
    db.refresh(user)
    create_audit_log(
        db,
        "User Deactivated",
        f"Admin '{admin_user.email}' deactivated user '{user.email}'",
        admin_user.id,
        admin_user.company_id,
    )
    return user

def reset_password(db: Session, reset_data: user_schema.PasswordReset):
    from app.auth import get_password_hash
    user = db.query(user_db.User).filter(user_db.User.email == reset_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")
    user.password_hash = get_password_hash(reset_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

def request_admin_role(db: Session, request_data: user_schema.RoleRequestCreate, current_user: user_db.User):
    from app.auth import verify_password
    # Verify the current user
    user = db.query(user_db.User).filter(user_db.User.email == current_user.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Verify current password
    if not verify_password(request_data.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect current password")
        
    # Verify if admin email belongs to an existing Admin
    admin = db.query(user_db.User).filter(user_db.User.email == request_data.admin_email, user_db.User.role == "Admin").first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin with the provided email not found")
        
    # Create Role Request
    new_request = role_request_db.RoleRequest(
        user_id=user.id,
        admin_email=admin.email,
        status="Pending"
    )
    db.add(new_request)
    db.commit()
    from app.controllers.audit_controller import create_audit_log
    create_audit_log(
        db,
        "Role Change Requested",
        f"User '{user.email}' requested an admin role change",
        user.id,
        user.company_id,
    )
    return {"message": "Role change request submitted successfully"}

def get_role_requests(db: Session, admin_email: str):
    requests = db.query(role_request_db.RoleRequest).filter(role_request_db.RoleRequest.admin_email == admin_email, role_request_db.RoleRequest.status == "Pending").all()
    result = []
    for req in requests:
        user = db.query(user_db.User).filter(user_db.User.id == req.user_id).first()
        result.append({
            "id": req.id,
            "user_id": req.user_id,
            "admin_email": req.admin_email,
            "status": req.status,
            "user_name": user.name if user else "Unknown",
            "user_email": user.email if user else "Unknown"
        })
    return result

def update_role_request(db: Session, request_id: int, status_update: user_schema.RoleRequestUpdate, admin_user: user_db.User):
    req = db.query(role_request_db.RoleRequest).filter(role_request_db.RoleRequest.id == request_id, role_request_db.RoleRequest.admin_email == admin_user.email).first()
    if not req:
        raise HTTPException(status_code=404, detail="Role request not found")
    
    if req.status != "Pending":
        raise HTTPException(status_code=400, detail="Request already processed")
        
    status = status_update.status
    if status == "Approved":
        req.status = "Approved"
        user = db.query(user_db.User).filter(user_db.User.id == req.user_id).first()
        if user:
            user.role = "Admin"
        event_type = "Role Change Approved"
        description = f"Admin '{admin_user.email}' approved role request for user '{user.email if user else req.user_id}'"
    elif status == "Rejected":
        req.status = "Rejected"
        event_type = "Role Change Rejected"
        description = f"Admin '{admin_user.email}' rejected role request for user id {req.user_id}"
    else:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    db.commit()
    from app.controllers.audit_controller import create_audit_log
    create_audit_log(db, event_type, description, admin_user.id, admin_user.company_id)
    return {"message": f"Role request {status.lower()} successfully"}
