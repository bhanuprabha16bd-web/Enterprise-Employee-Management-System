from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.config import Base

class Company(Base):
    """
    SQLAlchemy model representing a company entity in the system.
    """
    """
    Database model for storing company information.
    A company groups together users and employees.
    """
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    users = relationship("app.models.user_db.User", back_populates="company")
    employees = relationship("app.models.employee_db.Employee", back_populates="company")
