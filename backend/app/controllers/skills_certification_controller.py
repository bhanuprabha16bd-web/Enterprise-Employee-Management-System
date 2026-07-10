import os
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Optional, List
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.controllers.audit_controller import create_audit_log
from app.models.employee_db import Employee
from app.models.skills_certification_db import EmployeeSkill, EmployeeCertification
from app.models.notification_db import Notification

ALLOWED_CERTIFICATION_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"}


def validate_skill_payload(payload: dict, existing_skills: List[dict]) -> None:
    name = (payload.get("name") or "").strip()
    if not name:
        raise ValueError("Skill name is mandatory")
    if any((skill.get("name") or "").strip().lower() == name.lower() for skill in existing_skills):
        raise ValueError("Duplicate skill for this employee")
    years = payload.get("years_experience")
    if years is not None and years < 0:
        raise ValueError("Experience cannot be negative")


def validate_certification_payload(payload: dict, existing_certifications: List[dict]) -> None:
    name = (payload.get("name") or "").strip()
    issuer = (payload.get("issuing_organization") or "").strip()
    if not name or not issuer:
        raise ValueError("Certification name and issuing organization are required")
    if any(
        ((cert.get("name") or "").strip().lower() == name.lower() and (cert.get("issuing_organization") or "").strip().lower() == issuer.lower())
        for cert in existing_certifications
    ):
        raise ValueError("Duplicate certification for this employee")
    issue_date = payload.get("issue_date")
    expiry_date = payload.get("expiry_date")
    if issue_date and expiry_date:
        if datetime.strptime(expiry_date, "%Y-%m-%d") < datetime.strptime(issue_date, "%Y-%m-%d"):
            raise ValueError("Certification expiry date cannot be earlier than issue date")
    if payload.get("document_name"):
        doc_name = payload.get("document_name", "")
        ext = doc_name.rsplit(".", 1)[-1].lower() if "." in doc_name else ""
        if f".{ext}" not in ALLOWED_CERTIFICATION_EXTENSIONS:
            raise ValueError("Unsupported certification file type")


def _employee_exists(db: Session, employee_id: int, company_id: int) -> Employee:
    employee = db.query(Employee).filter(Employee.id == employee_id, Employee.company_id == company_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


def _build_skill_payload(skill: EmployeeSkill) -> dict:
    return {
        "id": skill.id,
        "employee_id": skill.employee_id,
        "company_id": skill.company_id,
        "name": skill.name,
        "proficiency_level": skill.proficiency_level,
        "years_experience": skill.years_experience,
        "is_primary": skill.is_primary,
        "created_at": skill.created_at.isoformat() if skill.created_at else None,
        "updated_at": skill.updated_at.isoformat() if skill.updated_at else None,
    }


def _build_certification_payload(certification: EmployeeCertification) -> dict:
    return {
        "id": certification.id,
        "employee_id": certification.employee_id,
        "company_id": certification.company_id,
        "name": certification.name,
        "issuing_organization": certification.issuing_organization,
        "issue_date": certification.issue_date,
        "expiry_date": certification.expiry_date,
        "document_name": certification.document_name,
        "document_path": certification.document_path,
        "created_at": certification.created_at.isoformat() if certification.created_at else None,
        "updated_at": certification.updated_at.isoformat() if certification.updated_at else None,
    }


def _authorize_employee_access(db: Session, employee_id: int, company_id: int, actor_role: Optional[str], actor_email: Optional[str]) -> Employee:
    employee = _employee_exists(db, employee_id, company_id)
    if actor_role == "Admin":
        return employee
    if actor_email and employee.email != actor_email:
        raise HTTPException(status_code=403, detail="You can only manage your own competency profile")
    return employee


def _save_certification_file(upload_file: Optional[UploadFile], employee_id: int, company_id: int) -> tuple[Optional[str], Optional[str]]:
    if not upload_file or not getattr(upload_file, "filename", None):
        return None, None
    ext = Path(upload_file.filename).suffix.lower()
    if ext not in ALLOWED_CERTIFICATION_EXTENSIONS:
        raise ValueError("Unsupported certification file type")
    upload_dir = Path(f"uploads/certifications/company_{company_id}/employee_{employee_id}")
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / upload_file.filename
    with file_path.open("wb") as f:
        f.write(upload_file.file.read())
    return upload_file.filename, str(file_path)


def get_employee_competency_profile(db: Session, employee_id: int, company_id: int, actor_role: Optional[str] = None, actor_email: Optional[str] = None) -> dict:
    employee = _authorize_employee_access(db, employee_id, company_id, actor_role, actor_email)
    skills = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id, EmployeeSkill.company_id == company_id).all()
    certifications = db.query(EmployeeCertification).filter(EmployeeCertification.employee_id == employee_id, EmployeeCertification.company_id == company_id).all()
    today = date.today()
    active_certs = 0
    expired_certs = 0
    for cert in certifications:
        if cert.expiry_date:
            if date.fromisoformat(cert.expiry_date) < today:
                expired_certs += 1
            else:
                active_certs += 1
        else:
            active_certs += 1
    return {
        "employee": {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "company_id": employee.company_id,
            "completion_score": employee.completion_score,
        },
        "skills": [_build_skill_payload(skill) for skill in skills],
        "certifications": [_build_certification_payload(cert) for cert in certifications],
        "summary": {
            "total_skills": len(skills),
            "primary_skills": sum(1 for skill in skills if skill.is_primary),
            "active_certifications": active_certs,
            "expired_certifications": expired_certs,
        },
    }


def list_company_competency_profiles(db: Session, company_id: int, search: Optional[str] = None, certification: Optional[str] = None, actor_role: Optional[str] = None, actor_email: Optional[str] = None) -> list[dict]:
    employees = db.query(Employee).filter(Employee.company_id == company_id).all()
    if actor_role != "Admin" and actor_email:
        employees = [employee for employee in employees if employee.email == actor_email]
    employee_ids = [employee.id for employee in employees]
    if not employee_ids:
        return []
    query = db.query(EmployeeSkill).filter(EmployeeSkill.company_id == company_id)
    if search:
        query = query.filter(EmployeeSkill.name.ilike(f"%{search}%"))
    matching_skill_employee_ids = {skill.employee_id for skill in query.all()}
    if certification:
        cert_query = db.query(EmployeeCertification).filter(EmployeeCertification.company_id == company_id)
        cert_query = cert_query.filter(EmployeeCertification.name.ilike(f"%{certification}%"))
        matching_cert_employee_ids = {cert.employee_id for cert in cert_query.all()}
        employee_ids = [employee_id for employee_id in employee_ids if employee_id in matching_cert_employee_ids]
    else:
        employee_ids = [employee_id for employee_id in employee_ids if employee_id in matching_skill_employee_ids] if search else employee_ids
    return [get_employee_competency_profile(db, employee_id, company_id, actor_role=actor_role, actor_email=actor_email) for employee_id in employee_ids]


def add_skill(db: Session, employee_id: int, company_id: int, payload: dict, actor_id: int, actor_role: Optional[str] = None, actor_email: Optional[str] = None) -> dict:
    employee = _authorize_employee_access(db, employee_id, company_id, actor_role, actor_email)
    existing_skills = [
        {"name": skill.name}
        for skill in db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id, EmployeeSkill.company_id == company_id).all()
    ]
    validate_skill_payload(payload, existing_skills)
    skill = EmployeeSkill(
        employee_id=employee_id,
        company_id=company_id,
        name=payload.get("name", "").strip(),
        proficiency_level=payload.get("proficiency_level", "Beginner"),
        years_experience=payload.get("years_experience", 0),
        is_primary=payload.get("is_primary", False),
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    create_audit_log(db, "Skill Added", f"Skill '{skill.name}' added for {employee.name}", actor_id, company_id)
    return _build_skill_payload(skill)


def update_skill(db: Session, employee_id: int, company_id: int, skill_id: int, payload: dict, actor_id: int, actor_role: Optional[str] = None, actor_email: Optional[str] = None) -> dict:
    employee = _authorize_employee_access(db, employee_id, company_id, actor_role, actor_email)
    skill = db.query(EmployeeSkill).filter(EmployeeSkill.id == skill_id, EmployeeSkill.employee_id == employee_id, EmployeeSkill.company_id == company_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    existing_skills = [
        {"name": existing.name} for existing in db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id, EmployeeSkill.company_id == company_id).filter(EmployeeSkill.id != skill_id).all()
    ]
    validate_skill_payload(payload, existing_skills)
    for key, value in payload.items():
        if key in {"name", "proficiency_level", "years_experience", "is_primary"}:
            setattr(skill, key, value)
    skill.name = skill.name.strip()
    db.commit()
    db.refresh(skill)
    create_audit_log(db, "Skill Updated", f"Skill '{skill.name}' updated for {employee.name}", actor_id, company_id)
    return _build_skill_payload(skill)


def delete_skill(db: Session, employee_id: int, company_id: int, skill_id: int, actor_id: int, actor_role: Optional[str] = None, actor_email: Optional[str] = None) -> dict:
    employee = _authorize_employee_access(db, employee_id, company_id, actor_role, actor_email)
    skill = db.query(EmployeeSkill).filter(EmployeeSkill.id == skill_id, EmployeeSkill.employee_id == employee_id, EmployeeSkill.company_id == company_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
    create_audit_log(db, "Skill Deleted", f"Skill '{skill.name}' deleted for {employee.name}", actor_id, company_id)
    return {"message": "Skill deleted successfully"}


def add_certification(db: Session, employee_id: int, company_id: int, payload: dict, actor_id: int, actor_role: Optional[str] = None, actor_email: Optional[str] = None, upload_file: Optional[UploadFile] = None) -> dict:
    employee = _authorize_employee_access(db, employee_id, company_id, actor_role, actor_email)
    existing_certifications = [
        {"name": cert.name, "issuing_organization": cert.issuing_organization}
        for cert in db.query(EmployeeCertification).filter(EmployeeCertification.employee_id == employee_id, EmployeeCertification.company_id == company_id).all()
    ]
    validate_certification_payload(payload, existing_certifications)
    document_name, document_path = _save_certification_file(upload_file, employee_id, company_id)
    if document_name is not None:
        payload["document_name"] = document_name
        payload["document_path"] = document_path
    cert = EmployeeCertification(
        employee_id=employee_id,
        company_id=company_id,
        name=payload.get("name", "").strip(),
        issuing_organization=payload.get("issuing_organization", "").strip(),
        issue_date=payload.get("issue_date"),
        expiry_date=payload.get("expiry_date"),
        document_name=payload.get("document_name"),
        document_path=payload.get("document_path"),
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    create_audit_log(db, "Certification Added", f"Certification '{cert.name}' added for {employee.name}", actor_id, company_id)
    return _build_certification_payload(cert)


def update_certification(db: Session, employee_id: int, company_id: int, certification_id: int, payload: dict, actor_id: int, actor_role: Optional[str] = None, actor_email: Optional[str] = None, upload_file: Optional[UploadFile] = None) -> dict:
    employee = _authorize_employee_access(db, employee_id, company_id, actor_role, actor_email)
    cert = db.query(EmployeeCertification).filter(EmployeeCertification.id == certification_id, EmployeeCertification.employee_id == employee_id, EmployeeCertification.company_id == company_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    existing_certifications = [
        {"name": existing.name, "issuing_organization": existing.issuing_organization}
        for existing in db.query(EmployeeCertification).filter(EmployeeCertification.employee_id == employee_id, EmployeeCertification.company_id == company_id).filter(EmployeeCertification.id != certification_id).all()
    ]
    validate_certification_payload(payload, existing_certifications)
    document_name, document_path = _save_certification_file(upload_file, employee_id, company_id)
    if document_name is not None:
        payload["document_name"] = document_name
        payload["document_path"] = document_path
    for key, value in payload.items():
        if key in {"name", "issuing_organization", "issue_date", "expiry_date", "document_name", "document_path"}:
            setattr(cert, key, value)
    cert.name = cert.name.strip()
    cert.issuing_organization = cert.issuing_organization.strip()
    db.commit()
    db.refresh(cert)
    create_audit_log(db, "Certification Updated", f"Certification '{cert.name}' updated for {employee.name}", actor_id, company_id)
    return _build_certification_payload(cert)


def delete_certification(db: Session, employee_id: int, company_id: int, certification_id: int, actor_id: int, actor_role: Optional[str] = None, actor_email: Optional[str] = None) -> dict:
    employee = _authorize_employee_access(db, employee_id, company_id, actor_role, actor_email)
    cert = db.query(EmployeeCertification).filter(EmployeeCertification.id == certification_id, EmployeeCertification.employee_id == employee_id, EmployeeCertification.company_id == company_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    db.delete(cert)
    db.commit()
    create_audit_log(db, "Certification Deleted", f"Certification '{cert.name}' deleted for {employee.name}", actor_id, company_id)
    return {"message": "Certification deleted successfully"}


def handle_expiring_certifications(db: Session, company_id: int) -> None:
    today = date.today()
    certifications = db.query(EmployeeCertification).filter(EmployeeCertification.company_id == company_id).all()
    for cert in certifications:
        if not cert.expiry_date:
            continue
        expiry_date = date.fromisoformat(cert.expiry_date)
        if expiry_date < today:
            create_audit_log(db, "Certification Expired", f"Certification '{cert.name}' expired for employee {cert.employee_id}", cert.employee_id, company_id)
            db.add(Notification(user_email=db.query(Employee).filter(Employee.id == cert.employee_id).first().email if db.query(Employee).filter(Employee.id == cert.employee_id).first() else "", message=f"Your certification '{cert.name}' has expired.", type="certification_expired"))
        elif expiry_date == today + timedelta(days=30):
            db.add(Notification(user_email=db.query(Employee).filter(Employee.id == cert.employee_id).first().email if db.query(Employee).filter(Employee.id == cert.employee_id).first() else "", message=f"Your certification '{cert.name}' expires soon.", type="certification_expiring"))
    db.commit()
