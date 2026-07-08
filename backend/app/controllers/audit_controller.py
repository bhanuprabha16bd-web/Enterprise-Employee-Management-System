from sqlalchemy.orm import Session
from app.models.audit_log_db import AuditLog
from app.models import user_db


def create_audit_log(db: Session, event_type: str, description: str, actor_id: int, company_id: int, device_name: str = None, browser: str = None, ip_address: str = None, session_identifier: str = None):
    """
    Creates a new audit log entry to track system events and actions performed by users.
    """
    """
    Create a new audit log entry.
    Records events like check-ins, data modifications, or administrative actions.
    """
    audit_log = AuditLog(
        event_type=event_type,
        description=description,
        actor_id=actor_id,
        company_id=company_id,
        device_name=device_name,
        browser=browser,
        ip_address=ip_address,
        session_identifier=session_identifier
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def get_audit_logs(db: Session, company_id: int):
    """
    Retrieves a list of audit logs for the specified company.
    """
    """
    Retrieve all audit logs for a specific company, ordered by creation date (descending).
    Includes the actor's name for easier display.
    """
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.company_id == company_id)
        .order_by(AuditLog.created_at.desc())
        .all()
    )
    result = []
    for log in logs:
        actor = db.query(user_db.User).filter(user_db.User.id == log.actor_id).first()
        result.append({
            "id": log.id,
            "event_type": log.event_type,
            "description": log.description,
            "actor_id": log.actor_id,
            "actor_name": actor.name if actor else "Unknown",
            "company_id": log.company_id,
            "created_at": log.created_at,
            "device_name": log.device_name,
            "browser": log.browser,
            "ip_address": log.ip_address,
            "session_identifier": log.session_identifier,
        })
    return result
