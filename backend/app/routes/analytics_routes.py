from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.config import SessionLocal
from app.models import analytics_schema, user_db
from app.controllers import analytics_controller
from app.auth import get_current_user, get_active_user

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
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

@router.get("/summary", response_model=analytics_schema.AnalyticsSummary)
def get_analytics_summary(current_user: user_db.User = Depends(get_active_user), db: Session = Depends(get_db)):
    """
    API Endpoint: Retrieves the analytics summary for the dashboard.
    """
    return analytics_controller.get_analytics_summary(db, current_user.company_id)
