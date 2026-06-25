from sqlalchemy.orm import Session
from app.models.notification_db import Notification

def get_user_notifications(db: Session, email: str):
    """
    Fetches the list of recent notifications for the specified user email.
    """
    """
    Retrieve all notifications for a given user email, ordered by most recent first.
    """
    return db.query(Notification).filter(Notification.user_email == email).order_by(Notification.created_at.desc()).all()

def mark_notification_as_read(db: Session, notification_id: int, email: str):
    """
    Marks a specific notification as having been read by the user.
    """
    """
    Mark a specific notification as read by its ID, ensuring it belongs to the user.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_email == email).first()
    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
    return notification

def clear_user_notifications(db: Session, email: str):
    """
    Clears all notifications for the given user.
    """
    """
    Delete all notifications associated with a given user's email.
    """
    db.query(Notification).filter(Notification.user_email == email).delete()
    db.commit()
    return {"message": "Notifications cleared"}
