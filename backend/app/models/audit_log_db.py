from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.database.config import Base

class AuditLog(Base):
    """
    SQLAlchemy model representing an immutable audit log entry for system actions.
    """
    """
    Database model representing an audit log entry.
    Used to track system events and actions performed by users within a company.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
