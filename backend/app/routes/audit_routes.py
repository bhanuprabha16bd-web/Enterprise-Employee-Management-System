from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.config import SessionLocal
from app.models import audit_log_schema, user_db
from app.controllers import audit_controller
from app.auth import get_current_user

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
    dependencies=[Depends(get_current_user)]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[audit_log_schema.AuditLogResponse])
def read_audit_logs(db: Session = Depends(get_db), current_user: user_db.User = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return audit_controller.get_audit_logs(db, current_user.company_id)
