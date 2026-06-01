from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import user_db, user_schema, role_request_db

def get_users(db: Session):
    return db.query(user_db.User).all()

def get_user(db: Session, user_id: int):
    user = db.query(user_db.User).filter(user_db.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def create_user(db: Session, user: user_schema.UserCreate):
    from app.auth import get_password_hash
    existing_user = db.query(user_db.User).filter(user_db.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    user_data = user.dict()
    password = user_data.pop("password")
    user_data["password_hash"] = get_password_hash(password)
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

def update_user(db: Session, user_id: int, updated_user: user_schema.UserUpdate):
    user = db.query(user_db.User).filter(user_db.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = updated_user.name
    user.email = updated_user.email
    user.role = updated_user.role
    user.bio = updated_user.bio
    user.company = updated_user.company
    user.website = updated_user.website
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(user_db.User).filter(user_db.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

def reset_password(db: Session, reset_data: user_schema.PasswordReset):
    from app.auth import get_password_hash
    user = db.query(user_db.User).filter(user_db.User.email == reset_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")
    user.password_hash = get_password_hash(reset_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

def request_admin_role(db: Session, request_data: user_schema.RoleRequestCreate, current_user_email: str):
    from app.auth import verify_password
    # Verify the current user
    user = db.query(user_db.User).filter(user_db.User.email == current_user_email).first()
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

def update_role_request(db: Session, request_id: int, status_update: user_schema.RoleRequestUpdate, admin_email: str):
    req = db.query(role_request_db.RoleRequest).filter(role_request_db.RoleRequest.id == request_id, role_request_db.RoleRequest.admin_email == admin_email).first()
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
    elif status == "Rejected":
        req.status = "Rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    db.commit()
    return {"message": f"Role request {status.lower()} successfully"}
