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
    """
    Normalizes the company name for consistent database storage and comparison.
    """
    """
    Normalize a company name for case-insensitive and whitespace-trimmed comparison.
    """
    return name.strip().lower()


def cleanup_duplicate_allowed_companies(db: Session):
    """
    Removes duplicate company entries from the allowed companies list.
    """
    """
    Clean up duplicate company records ensuring only canonical names are present.
    Merges duplicate companies by updating associated employees and users to a primary company ID.
    """
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
    """
    Fetches a list of all registered companies, optionally filtered by the current user's company.
    """
    """
    Retrieve a list of all allowed companies with their employee and user counts.
    Creates any missing canonical companies and cleans up duplicates before returning results.
    """
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
    """
    Retrieves detailed information for a specific company by its ID.
    """
    """
    Retrieve details for a specific company including the total count of employees and users.
    """
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
    """
    Updates the profile and settings of a given company.
    """
    """
    Update a company's information.
    Ensures the updated name is in the allowed list and not already taken by another company.
    """
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
