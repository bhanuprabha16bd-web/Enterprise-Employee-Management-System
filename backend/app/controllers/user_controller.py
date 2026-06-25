from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.controllers.audit_controller import create_audit_log
from app.models import user_db, user_schema, role_request_db, reactivation_request_db, attendance_request_db, attendance_request_schema
from app.models.notification_db import Notification

ACTIVE_STATUS = "Active"
SUSPENDED_STATUS = "Suspended"
DEACTIVATED_STATUS = "Deactivated"
LEGACY_DEACTIVATED_STATUS = "Inactive"
VALID_USER_STATUSES = {ACTIVE_STATUS, SUSPENDED_STATUS, DEACTIVATED_STATUS, LEGACY_DEACTIVATED_STATUS}
TERMINAL_ACCOUNT_STATUSES = {SUSPENDED_STATUS, DEACTIVATED_STATUS, LEGACY_DEACTIVATED_STATUS}

COMPANY_NAME_MAP = {
    "company inc": "Company Inc",
    "corp": "Corp",
    "global tech": "Global Tech"
}
ALLOWED_COMPANY_NAMES_DISPLAY = list(COMPANY_NAME_MAP.values())


def normalize_user_status(status: str | None) -> str:
    """
    Normalizes user account state names while preserving legacy Inactive records.
    """
    if status == LEGACY_DEACTIVATED_STATUS:
        return DEACTIVATED_STATUS
    return status or ACTIVE_STATUS


def validate_user_status(status: str | None) -> str:
    normalized = normalize_user_status(status)
    if normalized not in {ACTIVE_STATUS, SUSPENDED_STATUS, DEACTIVATED_STATUS}:
        raise HTTPException(status_code=400, detail="Status must be Active, Suspended, or Deactivated")
    return normalized


def add_notification(db: Session, user_email: str | None, message: str, notification_type: str = "info"):
    if not user_email:
        return None
    notification = Notification(
        user_email=user_email,
        message=message,
        type=notification_type,
    )
    db.add(notification)
    return notification


def notify_company_admins(
    db: Session,
    company_id: int,
    message: str,
    notification_type: str = "reinstatement",
    preferred_admin_id: int | None = None,
):
    admins_by_email = {
        admin.email: admin
        for admin in (
        db.query(user_db.User)
        .filter(
            user_db.User.company_id == company_id,
            user_db.User.role == "Admin",
            user_db.User.status == ACTIVE_STATUS,
        )
        .all()
        )
    }
    if preferred_admin_id:
        preferred_admin = (
            db.query(user_db.User)
            .filter(
                user_db.User.id == preferred_admin_id,
                user_db.User.company_id == company_id,
                user_db.User.role == "Admin",
                user_db.User.status != DEACTIVATED_STATUS,
            )
            .first()
        )
        if preferred_admin:
            admins_by_email[preferred_admin.email] = preferred_admin

    ordered_admins = sorted(admins_by_email.values(), key=lambda admin: 0 if admin.id == preferred_admin_id else 1)
    for admin in ordered_admins:
        add_notification(db, admin.email, message, notification_type)


def normalize_company_name(name: str) -> str:
    """
    Normalizes the company name for consistency.
    """
    return name.strip()


def canonical_company_name(name: str) -> str | None:
    """
    Maps a company name to its canonical representation if it exists.
    """
    return COMPANY_NAME_MAP.get(normalize_company_name(name).lower())


def is_allowed_company_name(name: str) -> bool:
    """
    Checks if the provided company name is in the allowed whitelist.
    """
    return canonical_company_name(name) is not None

def get_users(db: Session, company_id: int):
    """
    Retrieves a list of users belonging to a specific company.
    """
    return db.query(user_db.User).filter(user_db.User.company_id == company_id).all()

def get_user(db: Session, user_id: int, company_id: int):
    """
    Fetches a specific user's details by their user ID.
    """
    user = db.query(user_db.User).filter(user_db.User.id == user_id, user_db.User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def create_user(db: Session, user: user_schema.UserCreate):
    """
    Registers a new user in the system.
    """
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
    user_data["status"] = validate_user_status(user_data.get("status"))
    
    user_data["password_hash"] = get_password_hash(password)
    user_data["company_id"] = company.id
    
    new_user = user_db.User(**user_data)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, email: str, password: str):
    """
    Validates the user's email and password during the login process.
    """
    from app.auth import verify_password
    user = db.query(user_db.User).filter(user_db.User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def update_user(db: Session, user_id: int, updated_user: user_schema.UserUpdate, company_id: int):
    """
    Updates a user's profile information.
    """
    user = db.query(user_db.User).filter(user_db.User.id == user_id, user_db.User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    requested_status = validate_user_status(updated_user.status)
    if requested_status in TERMINAL_ACCOUNT_STATUSES:
        raise HTTPException(status_code=400, detail="Use the suspend or deactivate workflow to restrict account access")

    user.name = updated_user.name
    user.email = updated_user.email
    user.role = updated_user.role
    user.status = requested_status
    user.bio = updated_user.bio
    user.website = updated_user.website
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int, company_id: int):
    """
    Hard deletes a user record from the database.
    """
    user = db.query(user_db.User).filter(user_db.User.id == user_id, user_db.User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

def deactivate_user(db: Session, user_id: int, company_id: int, admin_user: user_db.User):
    """
    Soft deletes or deactivates a user account.
    """
    user = db.query(user_db.User).filter(user_db.User.id == user_id, user_db.User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if normalize_user_status(user.status) == DEACTIVATED_STATUS:
        raise HTTPException(status_code=400, detail="User is already deactivated")
    if user.status == SUSPENDED_STATUS:
        raise HTTPException(status_code=400, detail="Suspended users must be reinstated before deactivation")
    user.status = DEACTIVATED_STATUS
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
    """
    Submits a request to reactivate a deactivated user account.
    """
    if normalize_user_status(current_user.status) != DEACTIVATED_STATUS:
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
    """
    Retrieves reactivation requests submitted by the current user.
    """
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
    """
    Retrieves all pending reactivation requests for admin review.
    """
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
    """
    Approves or rejects a reactivation request.
    """
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
        user.status = ACTIVE_STATUS
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
    """
    Resets the user's password using the provided reset token or current password.
    """
    from app.auth import get_password_hash
    user = db.query(user_db.User).filter(user_db.User.email == reset_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")
    user.password_hash = get_password_hash(reset_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

def request_admin_role(db: Session, request_data: user_schema.RoleRequestCreate, current_user: user_db.User):
    """
    Submits a request for administrative privileges.
    """
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
    """
    Retrieves pending role change requests for administrative review.
    """
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
    """
    Approves or rejects a role change request.
    """
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
    """
    Submits a request for attendance module access.
    """
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
    """
    Fetches the current user's attendance access request.
    """
    request = db.query(attendance_request_db.AttendanceRequest).filter(
        attendance_request_db.AttendanceRequest.user_id == current_user.id,
        attendance_request_db.AttendanceRequest.company_id == current_user.company_id
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Attendance request not found")
    return request

def get_attendance_requests_for_admin(db: Session, admin_user: user_db.User):
    """
    Retrieves all attendance access requests for admins.
    """
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
    """
    Approves or rejects an attendance access request.
    """
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
    """
    Updates the user's last login timestamp, IP, and browser info.
    """
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
    """
    Logs the user out by clearing session/token data.
    """
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

from app.models.employee_db import Employee

def suspend_user(db: Session, email: str, company_id: int, admin_user: user_db.User, reason: str):
    """
    Suspends a user account with a specified reason.
    """
    user = db.query(user_db.User).filter(user_db.User.email == email, user_db.User.company_id == company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself")
    if normalize_user_status(user.status) == DEACTIVATED_STATUS:
        raise HTTPException(status_code=400, detail="Deactivated users cannot be suspended")
    if user.status == SUSPENDED_STATUS:
        raise HTTPException(status_code=400, detail="User is already suspended")
        
    user.status = SUSPENDED_STATUS
    user.suspended_by = admin_user.id
    user.suspended_at = datetime.utcnow()
    user.suspension_reason = reason

    employee = db.query(Employee).filter(Employee.email == email, Employee.company_id == company_id).first()
    if employee:
        employee.status = "Suspended"

    db.commit()
    db.refresh(user)
    if employee:
        db.refresh(employee)
    
    event_type = "Admin Suspended" if user.role == "Admin" else "User Suspended"
    create_audit_log(
        db,
        event_type,
        f"Admin '{admin_user.email}' suspended user '{user.email}' for reason: {reason}",
        admin_user.id,
        admin_user.company_id,
    )
    add_notification(
        db,
        user.email,
        f"Your account was suspended by {admin_user.email}. Reason: {reason}",
        "account_suspended",
    )
    db.commit()
    return user

def get_suspension_details(db: Session, current_user: user_db.User):
    """
    Retrieves details about a user's suspension.
    """
    if current_user.status != SUSPENDED_STATUS:
        raise HTTPException(status_code=400, detail="User is not suspended")
    
    admin = db.query(user_db.User).filter(user_db.User.id == current_user.suspended_by).first()
    
    return {
        "status": current_user.status,
        "suspended_at": current_user.suspended_at,
        "suspension_reason": current_user.suspension_reason,
        "suspended_by_name": admin.name if admin else "System",
        "suspended_by_email": admin.email if admin else "",
    }

from app.models import reinstatement_request_db

def create_reinstatement_request(db: Session, request_data: user_schema.ReinstatementRequestCreate, current_user: user_db.User):
    """
    Submits a request to reinstate a suspended account.
    """
    if current_user.status != SUSPENDED_STATUS:
        raise HTTPException(status_code=400, detail="Account is not suspended")

    existing_request = (
        db.query(reinstatement_request_db.ReinstatementRequest)
        .filter(
            reinstatement_request_db.ReinstatementRequest.user_id == current_user.id,
            reinstatement_request_db.ReinstatementRequest.company_id == current_user.company_id,
            reinstatement_request_db.ReinstatementRequest.status.in_(["Pending", "Approved"]),
        )
        .first()
    )
    if existing_request:
        return existing_request

    request = reinstatement_request_db.ReinstatementRequest(
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
        "Reinstatement Request Submitted",
        f"User '{current_user.email}' requested reinstatement",
        current_user.id,
        current_user.company_id,
    )
    notify_company_admins(
        db,
        current_user.company_id,
        f"Suspended user '{current_user.email}' submitted a reinstatement request.",
        "reinstatement_request",
        preferred_admin_id=current_user.suspended_by,
    )
    db.commit()
    return request

def get_reinstatement_requests(db: Session, current_user: user_db.User):
    """
    Fetches the current user's reinstatement requests.
    """
    requests = (
        db.query(reinstatement_request_db.ReinstatementRequest)
        .filter(
            reinstatement_request_db.ReinstatementRequest.user_id == current_user.id,
            reinstatement_request_db.ReinstatementRequest.company_id == current_user.company_id,
        )
        .order_by(reinstatement_request_db.ReinstatementRequest.created_at.desc())
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

def get_reinstatement_requests_for_admin(db: Session, admin_user: user_db.User):
    """
    Retrieves all reinstatement requests for admin review.
    """
    requests = (
        db.query(reinstatement_request_db.ReinstatementRequest, user_db.User)
        .join(user_db.User, user_db.User.id == reinstatement_request_db.ReinstatementRequest.user_id)
        .filter(
            reinstatement_request_db.ReinstatementRequest.company_id == admin_user.company_id,
            reinstatement_request_db.ReinstatementRequest.status == 'Pending',
        )
        .order_by(reinstatement_request_db.ReinstatementRequest.created_at.desc())
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

def update_reinstatement_request(db: Session, request_id: int, status_update: user_schema.ReinstatementRequestUpdate, admin_user: user_db.User):
    """
    Approves or rejects a reinstatement request.
    """
    request = (
        db.query(reinstatement_request_db.ReinstatementRequest)
        .filter(
            reinstatement_request_db.ReinstatementRequest.id == request_id,
            reinstatement_request_db.ReinstatementRequest.company_id == admin_user.company_id,
        )
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail='Reinstatement request not found')

    if request.status != 'Pending':
        raise HTTPException(status_code=400, detail='Request already processed')

    user = db.query(user_db.User).filter(user_db.User.id == request.user_id, user_db.User.company_id == admin_user.company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='Requested user not found')

    status = status_update.status
    if status == 'Approved':
        request.status = 'Approved'
        user.status = ACTIVE_STATUS
        user.suspended_by = None
        user.suspended_at = None
        user.suspension_reason = None
        employee = db.query(Employee).filter(Employee.email == user.email, Employee.company_id == user.company_id).first()
        if employee and employee.status == SUSPENDED_STATUS:
            employee.status = ACTIVE_STATUS
        event_type = 'Reinstatement Approved'
        description = f"Admin '{admin_user.email}' approved reinstatement for '{user.email}'"
        message = 'Reinstatement request approved successfully'
    elif status == 'Rejected':
        request.status = 'Rejected'
        event_type = 'Reinstatement Rejected'
        description = f"Admin '{admin_user.email}' rejected reinstatement for '{user.email}'"
        message = 'Reinstatement request rejected successfully'
    else:
        raise HTTPException(status_code=400, detail='Invalid status')

    db.commit()
    create_audit_log(db, event_type, description, admin_user.id, admin_user.company_id)
    if status == 'Approved':
        create_audit_log(db, 'User Reinstated', f"User '{user.email}' account was reinstated upon approval", admin_user.id, admin_user.company_id)
        add_notification(db, user.email, "Your reinstatement request was approved. Your account is active again.", "reinstatement_approved")
    elif status == 'Rejected':
        add_notification(db, user.email, "Your reinstatement request was rejected.", "reinstatement_rejected")
    db.commit()
    return {'message': message}
