from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database.config import SessionLocal
from app.models import session_schema, user_db
from app.controllers import session_controller
from app.auth import get_current_user, get_active_user, get_db
from typing import List

router = APIRouter(
    prefix="/sessions",
    tags=["Sessions"]
)

@router.get("/", response_model=List[session_schema.SessionResponse])
def get_user_sessions(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """API Endpoint: Lists user's sessions"""
    return session_controller.get_user_sessions(db, current_user.id)

@router.patch("/{session_id}/rename", response_model=session_schema.SessionResponse)
def rename_trusted_device(session_id: int, rename_data: session_schema.SessionRename, current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """API Endpoint: Renames a trusted device"""
    return session_controller.rename_trusted_device(db, session_id, rename_data.device_name, current_user)

@router.patch("/{session_id}/trusted")
def toggle_trusted_device(session_id: int, trusted: bool, current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """API Endpoint: Toggle trusted status of a device"""
    return session_controller.toggle_trusted_device(db, session_id, trusted, current_user)

@router.post("/{session_id}/logout")
def logout_session(session_id: int, current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """API Endpoint: Logout a specific session"""
    return session_controller.logout_session(db, session_id, current_user)

@router.post("/logout-all")
def logout_all_sessions(request: Request, current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """API Endpoint: Logout all other sessions"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = auth_header.split(" ")[1]
    
    # We need the session_token from the JWT to exclude the current session.
    # For now, we will extract it from the JWT in the controller or pass it down.
    import jwt
    from app.auth import SECRET_KEY, ALGORITHM
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        session_token = payload.get("session_token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    return session_controller.logout_all_sessions(db, session_token, current_user)

# Admin endpoints
@router.get("/admin", response_model=List[session_schema.SessionResponse])
def get_admin_sessions(current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """API Endpoint: Lists all sessions in the company for admins"""
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return session_controller.get_company_sessions(db, current_user.company_id)

@router.post("/admin/{session_id}/force-logout")
def force_logout_session(session_id: int, current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """API Endpoint: Force logout a session"""
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return session_controller.force_logout_session(db, session_id, current_user)

@router.post("/admin/revoke")
def revoke_sessions(data: session_schema.SessionRevokeList, current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """API Endpoint: Revoke multiple sessions"""
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return session_controller.revoke_sessions(db, data.session_ids, current_user)
