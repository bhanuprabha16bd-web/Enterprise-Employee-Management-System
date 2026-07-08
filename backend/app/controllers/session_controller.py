import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.session_db import UserSession
from app.models import user_db
from app.controllers.audit_controller import create_audit_log
from datetime import datetime, timezone

def create_session(db: Session, user: user_db.User, ip_address: str, browser: str, device_name: str = "Unknown Device"):
    session_token = str(uuid.uuid4())
    new_session = UserSession(
        user_id=user.id,
        company_id=user.company_id,
        session_token=session_token,
        device_name=device_name,
        browser=browser,
        ip_address=ip_address,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    create_audit_log(
        db=db,
        event_type="User Login",
        description=f"User logged in from {ip_address}",
        actor_id=user.id,
        company_id=user.company_id,
        device_name=device_name,
        browser=browser,
        ip_address=ip_address,
        session_identifier=session_token
    )
    return new_session

def get_user_sessions(db: Session, user_id: int):
    return db.query(UserSession).filter(UserSession.user_id == user_id).order_by(UserSession.last_activity.desc()).all()

def rename_trusted_device(db: Session, session_id: int, new_name: str, current_user: user_db.User):
    session = db.query(UserSession).filter(UserSession.id == session_id, UserSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check for duplicates
    duplicate = db.query(UserSession).filter(
        UserSession.user_id == current_user.id, 
        UserSession.device_name == new_name,
        UserSession.id != session_id,
        UserSession.trusted == True
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="A trusted device with this name already exists")

    session.device_name = new_name
    session.trusted = True
    db.commit()
    db.refresh(session)
    
    create_audit_log(db, "Trusted Device Renamed", f"Renamed to {new_name}", current_user.id, current_user.company_id, session.device_name, session.browser, session.ip_address, session.session_token)
    return session

def toggle_trusted_device(db: Session, session_id: int, trusted: bool, current_user: user_db.User):
    session = db.query(UserSession).filter(UserSession.id == session_id, UserSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.trusted = trusted
    db.commit()
    db.refresh(session)
    
    event = "Trusted Device Added" if trusted else "Trusted Device Removed"
    create_audit_log(db, event, event, current_user.id, current_user.company_id, session.device_name, session.browser, session.ip_address, session.session_token)
    return session

def logout_session(db: Session, session_id: int, current_user: user_db.User):
    session = db.query(UserSession).filter(UserSession.id == session_id, UserSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.status = "Logged Out"
    db.commit()
    
    create_audit_log(db, "User Logout", "Logged out from device", current_user.id, current_user.company_id, session.device_name, session.browser, session.ip_address, session.session_token)
    return {"message": "Logged out successfully"}

def logout_all_sessions(db: Session, current_session_token: str, current_user: user_db.User):
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id, 
        UserSession.session_token != current_session_token,
        UserSession.status == "Active"
    ).all()
    
    for s in sessions:
        s.status = "Logged Out"
    db.commit()
    
    create_audit_log(db, "User Logout", "Logged out from all other devices", current_user.id, current_user.company_id)
    return {"message": "Logged out of all other sessions"}

def get_company_sessions(db: Session, company_id: int):
    sessions = db.query(UserSession).filter(UserSession.company_id == company_id).order_by(UserSession.last_activity.desc()).all()
    # attach user email/name for display
    for s in sessions:
        u = db.query(user_db.User).filter(user_db.User.id == s.user_id).first()
        s.user_email = u.email if u else "Unknown"
        s.user_name = u.name if u else "Unknown"
    return sessions

def force_logout_session(db: Session, session_id: int, current_user: user_db.User):
    session = db.query(UserSession).filter(UserSession.id == session_id, UserSession.company_id == current_user.company_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "Active":
        return {"message": "Session is already terminated"}
    
    session.status = "Revoked"
    db.commit()
    
    create_audit_log(db, "Force Logout Initiated", f"Force logged out user {session.user_id}", current_user.id, current_user.company_id, session.device_name, session.browser, session.ip_address, session.session_token)
    return {"message": "Session force logged out"}

def revoke_sessions(db: Session, session_ids: list[int], current_user: user_db.User):
    sessions = db.query(UserSession).filter(UserSession.id.in_(session_ids), UserSession.company_id == current_user.company_id).all()
    for session in sessions:
        if session.status == "Active":
            session.status = "Revoked"
            create_audit_log(db, "Session Revoked", f"Session revoked for user {session.user_id}", current_user.id, current_user.company_id, session.device_name, session.browser, session.ip_address, session.session_token)
    db.commit()
    return {"message": "Sessions revoked successfully"}
