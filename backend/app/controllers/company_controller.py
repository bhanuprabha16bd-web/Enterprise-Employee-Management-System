from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.models.company_db import Company
from app.models.company_schema import CompanyBase
from app.models.employee_db import Employee
from app.models.user_db import User

ALLOWED_COMPANY_NAMES = ["Company Inc", "Corp", "Global Tech"]
COMPANY_CANONICAL_NAMES = {name.lower(): name for name in ALLOWED_COMPANY_NAMES}


def normalize_company_name(name: str) -> str:
    return name.strip().lower()


def cleanup_duplicate_allowed_companies(db: Session):
    allowed_lower = [name.lower() for name in ALLOWED_COMPANY_NAMES]
    companies = db.query(Company).filter(func.lower(Company.name).in_(allowed_lower)).all()
    grouped = {}
    for company in companies:
        key = normalize_company_name(company.name)
        grouped.setdefault(key, []).append(company)

    for rows in grouped.values():
        if len(rows) <= 1:
            continue
        rows.sort(key=lambda c: c.id)
        primary = rows[0]
        duplicates = rows[1:]
        for duplicate in duplicates:
            db.query(Employee).filter(Employee.company_id == duplicate.id).update(
                {Employee.company_id: primary.id}, synchronize_session=False
            )
            db.query(User).filter(User.company_id == duplicate.id).update(
                {User.company_id: primary.id}, synchronize_session=False
            )
            db.delete(duplicate)
        db.commit()

    for company in companies:
        canonical_name = COMPANY_CANONICAL_NAMES.get(normalize_company_name(company.name))
        if canonical_name and company.name != canonical_name:
            company.name = canonical_name
    db.commit()


def get_all_companies(db: Session, current_user_company_id: int):
    missing_companies = [name for name in ALLOWED_COMPANY_NAMES if not db.query(Company).filter(func.lower(Company.name) == name.lower()).first()]
    if missing_companies:
        for name in missing_companies:
            db.add(Company(name=name))
        db.commit()

    cleanup_duplicate_allowed_companies(db)

    companies = db.query(Company).filter(func.lower(Company.name).in_([name.lower() for name in ALLOWED_COMPANY_NAMES])).all()
    result = []
    seen = set()
    for c in companies:
        key = normalize_company_name(c.name)
        if key in seen:
            continue
        seen.add(key)
        emp_count = db.query(Employee).filter(Employee.company_id == c.id).count()
        user_count = db.query(User).filter(User.company_id == c.id).count()
        result.append({
            "_id": c.id,
            "id": c.id,
            "name": c.name,
            "slug": c.name.lower().replace(" ", "-"),
            "employeeCount": emp_count,
            "userCount": user_count,
            "isCurrentCompany": c.id == current_user_company_id,
            "total_employees": emp_count,
            "total_users": user_count
        })
    return result

def get_company_details(db: Session, company_id: int):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    total_employees = db.query(Employee).filter(Employee.company_id == company_id).count()
    total_users = db.query(User).filter(User.company_id == company_id).count()
    
    return {
        "id": company.id,
        "name": company.name,
        "total_employees": total_employees,
        "total_users": total_users
    }

def update_company(db: Session, company_id: int, company_data: CompanyBase):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if company_data.name not in ALLOWED_COMPANY_NAMES:
        raise HTTPException(status_code=400, detail=f"Company must be one of: {', '.join(ALLOWED_COMPANY_NAMES)}")

    # Check if another company has this name
    existing = db.query(Company).filter(Company.name == company_data.name, Company.id != company_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company name already taken")
        
    company.name = company_data.name
    db.commit()
    db.refresh(company)
    
    total_employees = db.query(Employee).filter(Employee.company_id == company_id).count()
    total_users = db.query(User).filter(User.company_id == company_id).count()
    
    return {
        "id": company.id,
        "name": company.name,
        "total_employees": total_employees,
        "total_users": total_users
    }
