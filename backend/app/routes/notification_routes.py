from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.controllers import notification_controller
from app.models.notification_schema import NotificationResponse
from app.database.config import SessionLocal
from app.auth import get_current_user, get_active_user
from typing import List

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
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

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user = Depends(get_active_user)):
    """
    API Endpoint: Retrieves user notifications.
    """
    return notification_controller.get_user_notifications(db, current_user.email)

@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user = Depends(get_active_user)):
    """
    API Endpoint: Marks a notification as read.
    """
    return notification_controller.mark_notification_as_read(db, notification_id, current_user.email)

@router.delete("/")
def clear_notifications(db: Session = Depends(get_db), current_user = Depends(get_active_user)):
    """
    API Endpoint: Clears all user notifications.
    """
    return notification_controller.clear_user_notifications(db, current_user.email)
