from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.config import Base

class Employee(Base):
    """
    SQLAlchemy model representing an employee record.
    """
    """
    Database model representing an employee.
    Holds personal information, status, and relationships to their department and company.
    """
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    status = Column(String, default="Active")
    joinDate = Column(String)
    avatar = Column(String)
    phone = Column(String)
    location = Column(String)

    department = relationship("app.models.department_db.Department", back_populates="employees")
    company = relationship("app.models.company_db.Company", back_populates="employees")
