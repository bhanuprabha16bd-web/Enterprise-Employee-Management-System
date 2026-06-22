from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    email = Column(String, unique=True, nullable=False)

    password_hash = Column(String, nullable=False)

    role = Column(String, nullable=False)

    status = Column(String, default="Active")

    bio = Column(String)

    company_id = Column(Integer, ForeignKey("companies.id"))

    deactivated_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    website = Column(String)

    attendance_access = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    last_login = Column(DateTime(timezone=True), nullable=True)
    last_logout = Column(DateTime(timezone=True), nullable=True)
    last_ip_address = Column(String, nullable=True)
    last_browser = Column(String, nullable=True)
    is_new_device_login = Column(Boolean, default=False)
    is_new_ip_login = Column(Boolean, default=False)

    company = relationship("app.models.company_db.Company", back_populates="users")

    @property
    def company_name(self):
        return self.company.name if self.company else ""
