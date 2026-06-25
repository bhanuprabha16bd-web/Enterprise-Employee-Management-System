from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.config import Base

class RoleRequest(Base):
    """
    SQLAlchemy model representing a user's request for an administrative role.
    """
    __tablename__ = "role_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    admin_email = Column(String, nullable=False)
    status = Column(String, default="Pending")
