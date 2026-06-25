from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date
from sqlalchemy.sql import func
from app.database.config import Base

class LeaveRequest(Base):
    """
    SQLAlchemy model representing an employee's leave or time-off request.
    """
    """
    Database model handling employee leave requests.
    Tracks the type of leave, start and end dates, reason, and approval status.
    """
    __tablename__ = 'leave_requests'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    leave_type = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(String, nullable=True)
    status = Column(String, default='Pending') # Pending, Approved, Rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
