from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.controllers.audit_controller import create_audit_log
from app.models import user_db, user_schema, role_request_db, reactivation_request_db, attendance_request_db, attendance_request_schema

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
    user = db.query(user_db.User).filter(user_db.User.id == user_id, user_db.User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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
    user.deactivated_by = admin_user.id
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

def create_reactivation_request(db: Session, request_data: user_schema.ReactivationRequestCreate, current_user: user_db.User):
    if current_user.status != "Inactive":
        raise HTTPException(status_code=400, detail="Account is already active")

    existing_request = (
        db.query(reactivation_request_db.ReactivationRequest)
        .filter(
            reactivation_request_db.ReactivationRequest.user_id == current_user.id,
            reactivation_request_db.ReactivationRequest.company_id == current_user.company_id,
            reactivation_request_db.ReactivationRequest.status.in_(["Pending", "Approved"]),
        )
        .first()
    )
    if existing_request:
        return existing_request

    request = reactivation_request_db.ReactivationRequest(
        user_id=current_user.id,
        company_id=current_user.company_id,
        reason=request_data.reason or "",
        status="Pending",
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    create_audit_log(
        db,
        "Reactivation Request Submitted",
        f"User '{current_user.email}' requested account reactivation",
        current_user.id,
        current_user.company_id,
    )
    return request


def get_reactivation_requests(db: Session, current_user: user_db.User):
    requests = (
        db.query(reactivation_request_db.ReactivationRequest)
        .filter(
            reactivation_request_db.ReactivationRequest.user_id == current_user.id,
            reactivation_request_db.ReactivationRequest.company_id == current_user.company_id,
        )
        .order_by(reactivation_request_db.ReactivationRequest.created_at.desc())
        .all()
    )

    return [
        {
            "id": request.id,
            "user_id": request.user_id,
            "company_id": request.company_id,
            "status": request.status,
            "reason": request.reason,
            "created_at": request.created_at,
            "updated_at": request.updated_at,
        }
        for request in requests
    ]


def get_reactivation_requests_for_admin(db: Session, admin_user: user_db.User):
    requests = (
        db.query(reactivation_request_db.ReactivationRequest, user_db.User)
        .join(user_db.User, user_db.User.id == reactivation_request_db.ReactivationRequest.user_id)
        .filter(
            reactivation_request_db.ReactivationRequest.company_id == admin_user.company_id,
            reactivation_request_db.ReactivationRequest.status == 'Pending',
            user_db.User.deactivated_by == admin_user.id,
        )
        .order_by(reactivation_request_db.ReactivationRequest.created_at.desc())
        .all()
    )

    return [
        {
            'id': request.id,
            'user_id': request.user_id,
            'user_name': user.name,
            'user_email': user.email,
            'company_id': request.company_id,
            'status': request.status,
            'reason': request.reason,
            'created_at': request.created_at,
            'updated_at': request.updated_at,
        }
        for request, user in requests
    ]


def update_reactivation_request(db: Session, request_id: int, status_update: user_schema.ReactivationRequestUpdate, admin_user: user_db.User):
    request = (
        db.query(reactivation_request_db.ReactivationRequest)
        .filter(
            reactivation_request_db.ReactivationRequest.id == request_id,
            reactivation_request_db.ReactivationRequest.company_id == admin_user.company_id,
        )
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail='Reactivation request not found')

    if request.status != 'Pending':
        raise HTTPException(status_code=400, detail='Reactivation request already processed')

    user = db.query(user_db.User).filter(user_db.User.id == request.user_id, user_db.User.company_id == admin_user.company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='Requested user not found')

    status = status_update.status
    if status == 'Approved':
        request.status = 'Approved'
        user.status = 'Active'
        user.deactivated_by = None
        event_type = 'Reactivation Approved'
        description = f"Admin '{admin_user.email}' approved reactivation for '{user.email}'"
        message = 'Reactivation request approved successfully'
    elif status == 'Rejected':
        request.status = 'Rejected'
        event_type = 'Reactivation Rejected'
        description = f"Admin '{admin_user.email}' rejected reactivation for '{user.email}'"
        message = 'Reactivation request rejected successfully'
    else:
        raise HTTPException(status_code=400, detail='Invalid status')

    db.commit()
    create_audit_log(db, event_type, description, admin_user.id, admin_user.company_id)
    if status == 'Approved':
        create_audit_log(db, 'User Activated', f"User '{user.email}' account was activated upon reactivation approval", admin_user.id, admin_user.company_id)
    return {'message': message}


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

    # Verify if admin email belongs to an existing Admin in the same company
    admin = db.query(user_db.User).filter(
        user_db.User.email == request_data.admin_email,
        user_db.User.role == "Admin",
    ).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin with the provided email not found")
    if admin.company_id != user.company_id:
        raise HTTPException(status_code=403, detail="Admin must belong to the same company")

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

def get_role_requests(db: Session, admin_user: user_db.User):
    requests = (
        db.query(role_request_db.RoleRequest, user_db.User)
        .join(user_db.User, user_db.User.id == role_request_db.RoleRequest.user_id)
        .filter(
            role_request_db.RoleRequest.admin_email == admin_user.email,
            role_request_db.RoleRequest.status == "Pending",
            user_db.User.company_id == admin_user.company_id,
        )
        .all()
    )
    result = []
    for req, user in requests:
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
    req = db.query(role_request_db.RoleRequest).filter(
        role_request_db.RoleRequest.id == request_id,
        role_request_db.RoleRequest.admin_email == admin_user.email,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Role request not found")

    user = db.query(user_db.User).filter(
        user_db.User.id == req.user_id,
        user_db.User.company_id == admin_user.company_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Role request not found for your company")

    if req.status != "Pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    status = status_update.status
    if status == "Approved":
        req.status = "Approved"
        user.role = "Admin"
        event_type = "Role Change Approved"
        description = f"Admin '{admin_user.email}' approved role request for user '{user.email}'"
    elif status == "Rejected":
        req.status = "Rejected"
        event_type = "Role Change Rejected"
        description = f"Admin '{admin_user.email}' rejected role request for user '{user.email}'"
    else:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    db.commit()
    from app.controllers.audit_controller import create_audit_log
    create_audit_log(db, event_type, description, admin_user.id, admin_user.company_id)
    return {"message": f"Role request {status.lower()} successfully"}

def create_attendance_request(db: Session, current_user: user_db.User):
    existing = db.query(attendance_request_db.AttendanceRequest).filter(
        attendance_request_db.AttendanceRequest.user_id == current_user.id,
        attendance_request_db.AttendanceRequest.company_id == current_user.company_id
    ).first()
    if existing:
        return existing
        
    request = attendance_request_db.AttendanceRequest(
        user_id=current_user.id,
        company_id=current_user.company_id,
        status="Pending"
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    
    create_audit_log(
        db,
        "Attendance Access Requested",
        f"User '{current_user.email}' requested attendance access",
        current_user.id,
        current_user.company_id,
    )
    return request

def get_attendance_request(db: Session, current_user: user_db.User):
    request = db.query(attendance_request_db.AttendanceRequest).filter(
        attendance_request_db.AttendanceRequest.user_id == current_user.id,
        attendance_request_db.AttendanceRequest.company_id == current_user.company_id
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Attendance request not found")
    return request

def get_attendance_requests_for_admin(db: Session, admin_user: user_db.User):
    requests = (
        db.query(attendance_request_db.AttendanceRequest, user_db.User)
        .join(user_db.User, user_db.User.id == attendance_request_db.AttendanceRequest.user_id)
        .filter(
            attendance_request_db.AttendanceRequest.company_id == admin_user.company_id,
            attendance_request_db.AttendanceRequest.status == "Pending",
        )
        .order_by(attendance_request_db.AttendanceRequest.created_at.desc())
        .all()
    )
    return [
        {
            "id": req.id,
            "user_id": req.user_id,
            "company_id": req.company_id,
            "status": req.status,
            "created_at": req.created_at,
            "updated_at": req.updated_at,
            "user_name": user.name,
            "user_email": user.email,
        }
        for req, user in requests
    ]

def update_attendance_request(db: Session, request_id: int, status_update: attendance_request_schema.AttendanceRequestUpdate, admin_user: user_db.User):
    req = db.query(attendance_request_db.AttendanceRequest).filter(
        attendance_request_db.AttendanceRequest.id == request_id,
        attendance_request_db.AttendanceRequest.company_id == admin_user.company_id
    ).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Attendance request not found")
        
    if req.status != "Pending":
        raise HTTPException(status_code=400, detail="Request already processed")
        
    user = db.query(user_db.User).filter(
        user_db.User.id == req.user_id,
        user_db.User.company_id == admin_user.company_id
    ).first()
    
    status = status_update.status
    if status == "Approved":
        req.status = "Approved"
        if user:
            user.attendance_access = True
        event_type = "Attendance Access Approved"
        description = f"Admin '{admin_user.email}' approved attendance access for '{user.email if user else 'Unknown'}'"
    elif status == "Rejected":
        req.status = "Rejected"
        event_type = "Attendance Access Rejected"
        description = f"Admin '{admin_user.email}' rejected attendance access for '{user.email if user else 'Unknown'}'"
    else:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    db.commit()
    create_audit_log(db, event_type, description, admin_user.id, admin_user.company_id)
    return {"message": f"Attendance request {status.lower()} successfully"}

from datetime import datetime

def update_login_activity(db: Session, user: user_db.User, ip_address: str, browser_info: str):
    is_new_device = False
    is_new_ip = False
    
    if user.last_browser and user.last_browser != browser_info:
        is_new_device = True
    if user.last_ip_address and user.last_ip_address != ip_address:
        is_new_ip = True
        
    user.last_login = datetime.utcnow()
    user.last_ip_address = ip_address
    user.last_browser = browser_info
    user.is_new_device_login = is_new_device
    user.is_new_ip_login = is_new_ip
    
    db.commit()
    
    create_audit_log(
        db,
        "User Login",
        f"User '{user.email}' logged in",
        user.id,
        user.company_id
    )
    
    if is_new_device:
        create_audit_log(
            db,
            "New Device Detected",
            f"User '{user.email}' logged in from a new device/browser",
            user.id,
            user.company_id
        )
        
    if is_new_ip:
        create_audit_log(
            db,
            "New IP Address Detected",
            f"User '{user.email}' logged in from a new IP address: {ip_address}",
            user.id,
            user.company_id
        )
    return user

def logout_user(db: Session, user: user_db.User):
    user.last_logout = datetime.utcnow()
    db.commit()
    
    create_audit_log(
        db,
        "User Logout",
        f"User '{user.email}' logged out",
        user.id,
        user.company_id
    )
    return {"message": "Logged out successfully"}
