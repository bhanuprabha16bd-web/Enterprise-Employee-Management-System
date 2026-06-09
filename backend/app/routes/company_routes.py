from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.config import SessionLocal
from app.models import company_schema, user_db
from app.controllers import company_controller
from app.auth import get_current_user

router = APIRouter(
    prefix="/company",
    tags=["Company"],
    dependencies=[Depends(get_current_user)]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/all", response_model=list[company_schema.ExtendedCompanyResponse])
def get_all_companies(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return company_controller.get_all_companies(db, current_user.company_id)

@router.get("/", response_model=company_schema.CompanyResponse)
def get_company(current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return company_controller.get_company_details(db, current_user.company_id)

@router.put("/", response_model=company_schema.CompanyResponse)
def update_company(company_data: company_schema.CompanyBase, current_user: user_db.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return company_controller.update_company(db, current_user.company_id, company_data)


