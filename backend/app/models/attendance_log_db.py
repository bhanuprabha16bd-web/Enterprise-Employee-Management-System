from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Float
from sqlalchemy.sql import func
from app.database.config import Base

class AttendanceLog(Base):
    __tablename__ = 'attendance_logs'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    date = Column(Date, nullable=False)
    check_in_time = Column(DateTime(timezone=True), nullable=False)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    total_hours = Column(Float, nullable=True)
    status = Column(String, default='Present')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
