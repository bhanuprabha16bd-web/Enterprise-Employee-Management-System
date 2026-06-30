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
    employee_id = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    status = Column(String, default="Active")
    joinDate = Column(String)
    avatar = Column(String)
    phone = Column(String)
    location = Column(String)
    completion_score = Column(Integer, default=0)

    department = relationship("app.models.department_db.Department", back_populates="employees")
    company = relationship("app.models.company_db.Company", back_populates="employees")

    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @property
    def missing_fields(self) -> list[str]:
        missing = []
        if not self.first_name:
            missing.append("First Name")
        if not self.last_name:
            missing.append("Last Name")
        if not self.email:
            missing.append("Email")
        if not self.phone:
            missing.append("Phone Number")
        if not self.department_id:
            missing.append("Department")
        if not self.role:
            missing.append("Designation")
        if not self.avatar:
            missing.append("Profile Picture")
        if not self.location:
            missing.append("Address")
        if not self.joinDate:
            missing.append("Date of Joining")
        if not self.employee_id:
            missing.append("Employee ID")
        return missing
