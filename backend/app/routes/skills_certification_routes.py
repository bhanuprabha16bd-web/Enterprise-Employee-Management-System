import json
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.controllers import skills_certification_controller
from app.database.config import SessionLocal
from app.auth import get_active_user

router = APIRouter(prefix="/competencies", tags=["Skills & Certifications"], dependencies=[Depends(get_active_user)])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/employees/{employee_id}/profile", response_model=dict)
def get_profile(employee_id: int, db: Session = Depends(get_db), current_user=Depends(get_active_user)):
    return skills_certification_controller.get_employee_competency_profile(db, employee_id, current_user.company_id, actor_role=current_user.role, actor_email=current_user.email)


@router.get("/company", response_model=List[dict])
def list_company_profiles(search: Optional[str] = None, certification: Optional[str] = None, db: Session = Depends(get_db), current_user=Depends(get_active_user)):
    return skills_certification_controller.list_company_competency_profiles(db, current_user.company_id, search=search, certification=certification, actor_role=current_user.role, actor_email=current_user.email)


@router.post("/employees/{employee_id}/skills", response_model=dict)
def add_skill(employee_id: int, payload: dict, db: Session = Depends(get_db), current_user=Depends(get_active_user)):
    return skills_certification_controller.add_skill(db, employee_id, current_user.company_id, payload, current_user.id, actor_role=current_user.role, actor_email=current_user.email)


@router.put("/employees/{employee_id}/skills/{skill_id}", response_model=dict)
def update_skill(employee_id: int, skill_id: int, payload: dict, db: Session = Depends(get_db), current_user=Depends(get_active_user)):
    return skills_certification_controller.update_skill(db, employee_id, current_user.company_id, skill_id, payload, current_user.id, actor_role=current_user.role, actor_email=current_user.email)


@router.delete("/employees/{employee_id}/skills/{skill_id}")
def delete_skill(employee_id: int, skill_id: int, db: Session = Depends(get_db), current_user=Depends(get_active_user)):
    return skills_certification_controller.delete_skill(db, employee_id, current_user.company_id, skill_id, current_user.id, actor_role=current_user.role, actor_email=current_user.email)


@router.post("/employees/{employee_id}/certifications", response_model=dict)
def add_certification(employee_id: int, payload: str = Form(...), file: Optional[UploadFile] = File(None), db: Session = Depends(get_db), current_user=Depends(get_active_user)):
    try:
        parsed_payload = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    return skills_certification_controller.add_certification(db, employee_id, current_user.company_id, parsed_payload, current_user.id, actor_role=current_user.role, actor_email=current_user.email, upload_file=file)


@router.put("/employees/{employee_id}/certifications/{certification_id}", response_model=dict)
def update_certification(employee_id: int, certification_id: int, payload: str = Form(...), file: Optional[UploadFile] = File(None), db: Session = Depends(get_db), current_user=Depends(get_active_user)):
    try:
        parsed_payload = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    return skills_certification_controller.update_certification(db, employee_id, current_user.company_id, certification_id, parsed_payload, current_user.id, actor_role=current_user.role, actor_email=current_user.email, upload_file=file)


@router.delete("/employees/{employee_id}/certifications/{certification_id}")
def delete_certification(employee_id: int, certification_id: int, db: Session = Depends(get_db), current_user=Depends(get_active_user)):
    return skills_certification_controller.delete_certification(db, employee_id, current_user.company_id, certification_id, current_user.id, actor_role=current_user.role, actor_email=current_user.email)
