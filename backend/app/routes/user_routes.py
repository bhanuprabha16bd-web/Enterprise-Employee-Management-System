from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.config import SessionLocal
from app.models import user_schema, user_db, attendance_request_schema
from app.controllers import user_controller, invitation_controller
from app.auth import get_current_user, get_active_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

def get_db():
    """
    Dependency function to provide a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[user_schema.UserResponse])
def get_users(db: Session = Depends(get_db), current_user: user_db.User = Depends(get_active_user)):
    """
    API Endpoint: Lists all users.
    """
    try:
        users = user_controller.get_users(db, current_user.company_id)
        return [user_schema.UserResponse.model_validate(u) for u in users]
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Serialization Error: {str(e)}")

@router.get("/invitations", response_model=list[user_schema.InvitationResponse])
def get_invitations(current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Lists all invitations.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return invitation_controller.get_invitations(db, current_user.company_id)

@router.post("/invitations", response_model=user_schema.InvitationResponse)
def create_invitation(invitation_data: user_schema.InvitationCreate, current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Creates a new invitation.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return invitation_controller.create_invitation(db, invitation_data.email, invitation_data.role, current_user)

@router.delete("/invitations/{invitation_id}")
def revoke_invitation(invitation_id: int, current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Revokes an invitation.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return invitation_controller.revoke_invitation(db, invitation_id, current_user.company_id, current_user)

@router.get("/invitations/verify/{token}", response_model=user_schema.InvitationResponse)
def verify_invitation(token: str, db: Session = Depends(get_db)):
    """
    API Endpoint: Verifies an invitation token.
    """
    return invitation_controller.verify_invitation(db, token)

@router.post("/request-role")
def request_role_change(request_data: user_schema.RoleRequestCreate, current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Submits a role change request.
    """
    return user_controller.request_admin_role(db, request_data, current_user)


@router.post("/reactivation-requests", response_model=user_schema.ReactivationRequestResponse)
def create_reactivation_request(request_data: user_schema.ReactivationRequestCreate, current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Submits an account reactivation request.
    """
    return user_controller.create_reactivation_request(db, request_data, current_user)


@router.get("/reactivation-requests", response_model=list[user_schema.ReactivationRequestResponse])
def get_reactivation_requests(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Retrieves user's reactivation requests.
    """
    return user_controller.get_reactivation_requests(db, current_user)


@router.get("/reactivation-requests/admin", response_model=list[user_schema.ReactivationRequestResponse])
def get_reactivation_requests_for_admin(current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Retrieves all reactivation requests for admins.
    """
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail='Not authorized')
    return user_controller.get_reactivation_requests_for_admin(db, current_user)


@router.put("/reactivation-requests/{request_id}")
def update_reactivation_request(request_id: int, status_update: user_schema.ReactivationRequestUpdate, current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Approves/rejects reactivation request.
    """
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail='Not authorized')
    return user_controller.update_reactivation_request(db, request_id, status_update, current_user)

@router.get("/role-requests", response_model=list[user_schema.RoleRequestResponse])
def get_role_requests(current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Retrieves all role requests.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user_controller.get_role_requests(db, current_user)

@router.put("/role-requests/{request_id}")
def update_role_request(request_id: int, status_update: user_schema.RoleRequestUpdate, current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Approves/rejects role request.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user_controller.update_role_request(db, request_id, status_update, current_user)

@router.get("/{user_id}", response_model=user_schema.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: user_db.User = Depends(get_active_user)):
    """
    API Endpoint: Gets a specific user's details.
    """
    return user_controller.get_user(db, user_id, current_user.company_id)

@router.post("/", response_model=user_schema.UserResponse)
def create_user(user: user_schema.UserCreate, db: Session = Depends(get_db)):
    """
    API Endpoint: Registers a new user.
    """
    return user_controller.create_user(db, user)

@router.put("/{user_id}/deactivate", response_model=user_schema.UserResponse)
def deactivate_user(user_id: int, current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Deactivates a user account.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user_controller.deactivate_user(db, user_id, current_user.company_id, current_user)

@router.put("/{user_id}", response_model=user_schema.UserResponse)
def update_user(user_id: int, updated_user: user_schema.UserUpdate, db: Session = Depends(get_db), current_user: user_db.User = Depends(get_active_user)):
    """
    API Endpoint: Updates a user's profile.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user_controller.update_user(db, user_id, updated_user, current_user.company_id)

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: user_db.User = Depends(get_active_user)):
    """
    API Endpoint: Hard deletes a user.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user_controller.delete_user(db, user_id, current_user.company_id)

@router.post("/login", response_model=user_schema.Token)
def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    API Endpoint: Authenticates user and returns JWT token.
    """
    from app.auth import create_access_token
    user = user_controller.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    ip_address = request.client.host if request.client else "Unknown"
    browser_info = request.headers.get("user-agent", "Unknown")
    user = user_controller.update_login_activity(db, user, ip_address, browser_info)

    def format_date(dt):
        """
        Utility to format dates for response.
        """
        if not dt: return None
        if hasattr(dt, 'isoformat'): return dt.isoformat()
        return str(dt)

    access_token = create_access_token(data={
        "sub": user.email,
        "role": user.role,
        "name": user.name,
        "status": user.status,
        "company_id": user.company_id,
        "attendance_access": user.attendance_access,
        "created_at": format_date(user.created_at),
    })
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Logs out the current user.
    """
    return user_controller.logout_user(db, current_user)

@router.post("/reset-password")
def reset_password(reset_data: user_schema.PasswordReset, db: Session = Depends(get_db)):
    """
    API Endpoint: Resets user password.
    """
    return user_controller.reset_password(db, reset_data)

@router.post("/attendance-requests", response_model=attendance_request_schema.AttendanceRequestResponse)
def create_attendance_request(current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Submits an attendance access request.
    """
    return user_controller.create_attendance_request(db, current_user)

@router.get("/attendance-requests/me", response_model=attendance_request_schema.AttendanceRequestResponse)
def get_attendance_request(current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Retrieves user's attendance access request.
    """
    return user_controller.get_attendance_request(db, current_user)

@router.get("/attendance-requests/admin", response_model=list[attendance_request_schema.AttendanceRequestResponse])
def get_attendance_requests_for_admin(current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Retrieves all attendance requests.
    """
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail='Not authorized')
    return user_controller.get_attendance_requests_for_admin(db, current_user)

@router.put("/attendance-requests/{request_id}")
def update_attendance_request(request_id: int, status_update: attendance_request_schema.AttendanceRequestUpdate, current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Approves/rejects attendance request.
    """
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail='Not authorized')
    return user_controller.update_attendance_request(db, request_id, status_update, current_user)

@router.put("/{email}/suspend")
def suspend_user(email: str, request_data: user_schema.SuspendUserRequest, current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Suspends a user account.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user_controller.suspend_user(db, email, current_user.company_id, current_user, request_data.reason)

@router.get("/me/suspension-details", response_model=user_schema.SuspensionDetailsResponse)
def get_suspension_details(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Retrieves user's suspension details.
    """
    return user_controller.get_suspension_details(db, current_user)

@router.post("/reinstatement-requests", response_model=user_schema.ReinstatementRequestResponse)
def create_reinstatement_request(request_data: user_schema.ReinstatementRequestCreate, current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Submits a reinstatement request.
    """
    return user_controller.create_reinstatement_request(db, request_data, current_user)

@router.get("/reinstatement-requests", response_model=list[user_schema.ReinstatementRequestResponse])
def get_reinstatement_requests(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Retrieves user's reinstatement requests.
    """
    return user_controller.get_reinstatement_requests(db, current_user)

@router.get("/admin/reinstatement-requests", response_model=list[user_schema.ReinstatementRequestResponse])
def get_reinstatement_requests_for_admin(current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Retrieves all reinstatement requests.
    """
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail='Not authorized')
    return user_controller.get_reinstatement_requests_for_admin(db, current_user)

@router.put("/admin/reinstatement-requests/{request_id}")
def update_reinstatement_request(request_id: int, status_update: user_schema.ReinstatementRequestUpdate, current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Approves/rejects reinstatement request.
    """
    if current_user.role != 'Admin':
        raise HTTPException(status_code=403, detail='Not authorized')
    return user_controller.update_reinstatement_request(db, request_id, status_update, current_user)
