from sqlalchemy.orm import Session
from app.models.notification_db import Notification

def get_user_notifications(db: Session, email: str):
    return db.query(Notification).filter(Notification.user_email == email).order_by(Notification.created_at.desc()).all()

def mark_notification_as_read(db: Session, notification_id: int, email: str):
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_email == email).first()
    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
    return notification

def clear_user_notifications(db: Session, email: str):
    db.query(Notification).filter(Notification.user_email == email).delete()
    db.commit()
    return {"message": "Notifications cleared"}
