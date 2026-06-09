from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.config import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    employees = relationship("app.models.employee_db.Employee", back_populates="department")
