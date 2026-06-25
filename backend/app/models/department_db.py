from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.config import Base

class Department(Base):
    """
    SQLAlchemy model representing a department within a company.
    """
    """
    Database model for managing organizational departments.
    Maintains a relationship to the employees belonging to the department.
    """
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    employees = relationship("app.models.employee_db.Employee", back_populates="department")
