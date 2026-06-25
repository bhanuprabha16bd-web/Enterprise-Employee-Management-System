from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.database.config import SessionLocal
from app.auth import get_current_user, get_active_user
from app.models import user_db, export_log_schema
from app.controllers import export_controller

router = APIRouter(
    prefix="/export",
    tags=["Export"],
    dependencies=[Depends(get_active_user)]
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

@router.get("/history", response_model=List[export_log_schema.ExportLogWithUserResponse])
def get_export_history(db: Session = Depends(get_db), current_user: user_db.User = Depends(get_active_user)):
    """
    API Endpoint: Retrieves the export history logs.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return export_controller.get_export_history(db, current_user.company_id)

@router.get("/download")
def download_export(
    entity: str = Query(..., description="Entity to export (e.g. employees, attendance)"),
    format: str = Query(..., description="Format to export (csv, excel, pdf)"),
    db: Session = Depends(get_db), 
    current_user: user_db.User = Depends(get_active_user)
):
    """
    API Endpoint: Generates and downloads an export file.
    """
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return export_controller.generate_export(db, entity, format, current_user.company_id, current_user.id)
