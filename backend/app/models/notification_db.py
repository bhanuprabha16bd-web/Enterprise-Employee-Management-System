from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database.config import Base

class Notification(Base):
    """
    SQLAlchemy model representing a system notification sent to a user.
    """
    """
    Database model for managing system or user-specific notifications.
    Stores the message, type, and whether it has been read.
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
