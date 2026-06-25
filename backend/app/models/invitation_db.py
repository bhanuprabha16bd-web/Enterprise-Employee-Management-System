from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.config import Base


def default_expires_at():
    """
    Returns a default expiration date (7 days from the current UTC time).
    """
    return datetime.utcnow() + timedelta(days=7)


class Invitation(Base):
    """
    SQLAlchemy model representing an invitation sent to a prospective user.
    """
    """
    Database model for managing user invitations to join a company.
    Includes the invitation token, target email, role, and expiration details.
    """
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    status = Column(String, default="Pending")
    role = Column(String, default="Employee")
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=default_expires_at)

    inviter = relationship("app.models.user_db.User")
