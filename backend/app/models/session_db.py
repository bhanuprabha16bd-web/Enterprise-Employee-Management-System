from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from app.database.config import Base

class UserSession(Base):
    """
    SQLAlchemy model representing a user's login session and device.
    """
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    session_token = Column(String, unique=True, nullable=False, index=True)
    device_name = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    login_time = Column(DateTime(timezone=True), server_default=func.now())
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    status = Column(String, default="Active") # Active, Logged Out, Revoked, Expired
    trusted = Column(Boolean, default=False)
