from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database.config import Base

class AttendanceRequest(Base):
    """
    SQLAlchemy model representing a user's request for attendance tracking access.
    """
    """
    Database model for managing attendance-related requests (e.g., regularization).
    Tracks the status of the request (Pending, Approved, Rejected) for a user.
    """
    __tablename__ = 'attendance_requests'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    status = Column(String, default='Pending', nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
