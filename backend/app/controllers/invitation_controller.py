import uuid
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.models import user_db, invitation_db
from app.controllers.audit_controller import create_audit_log


def create_invitation(db, email: str, role: str, admin_user: user_db.User):
    """
    Generates a new invitation token and sends it to the specified email.
    """
    """
    Create a new user invitation.
    Verifies that the inviter is an Admin, checks if the email is already registered or invited,
    generates a unique token, and creates the invitation record.
    """
    if admin_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    existing_user = db.query(user_db.User).filter(
        user_db.User.email == email,
        user_db.User.company_id == admin_user.company_id,
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists in your company")

    existing_invite = db.query(invitation_db.Invitation).filter(
        invitation_db.Invitation.email == email,
        invitation_db.Invitation.company_id == admin_user.company_id,
        invitation_db.Invitation.status == "Pending",
    ).first()
    if existing_invite:
        raise HTTPException(status_code=400, detail="There is already a pending invitation for this email")

    token = uuid.uuid4().hex
    invite = invitation_db.Invitation(
        email=email,
        token=token,
        role=role or "Employee",
        invited_by=admin_user.id,
        company_id=admin_user.company_id,
        status="Pending",
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    create_audit_log(
        db,
        "Invitation Created",
        f"Admin '{admin_user.email}' created invitation for '{email}'",
        admin_user.id,
        admin_user.company_id,
    )
    return invite


def get_invitations(db, company_id: int):
    """
    Retrieves a list of active and pending invitations for the company.
    """
    """
    Retrieve a list of all invitations for a specific company.
    """
    invites = db.query(invitation_db.Invitation).filter(invitation_db.Invitation.company_id == company_id).all()
    return invites


def revoke_invitation(db, invitation_id: int, company_id: int, admin_user: user_db.User):
    """
    Revokes an existing invitation, preventing it from being used.
    """
    """
    Revoke a pending invitation.
    Changes the status to 'Revoked' and logs the admin action.
    """
    invitation = db.query(invitation_db.Invitation).filter(
        invitation_db.Invitation.id == invitation_id,
        invitation_db.Invitation.company_id == company_id,
    ).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if invitation.status != "Pending":
        raise HTTPException(status_code=400, detail="Invitation cannot be revoked")

    invitation.status = "Revoked"
    db.commit()
    create_audit_log(
        db,
        "Invitation Revoked",
        f"Admin '{admin_user.email}' revoked invitation for '{invitation.email}'",
        admin_user.id,
        admin_user.company_id,
    )
    return {"message": "Invitation revoked successfully"}


def verify_invitation(db, token: str):
    """
    Validates an invitation token and returns the associated role/company.
    """
    """
    Verify the validity of an invitation token.
    Checks if the token exists, is pending, and has not expired.
    Raises HTTPException for invalid or expired tokens.
    """
    invitation = db.query(invitation_db.Invitation).filter(
        invitation_db.Invitation.token == token,
        invitation_db.Invitation.status == "Pending",
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation link")
    
    if invitation.expires_at < datetime.utcnow():
        invitation.status = "Expired"
        db.commit()
        raise HTTPException(status_code=400, detail="Invitation link has expired")

    return invitation
