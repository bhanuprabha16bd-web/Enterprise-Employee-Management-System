from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.config import Base

class DepartmentTransfer(Base):
    """
    SQLAlchemy model representing the history of an employee's department transfers.
    """
    """
    Database model representing the transfer of an employee between departments.
    Tracks the source and destination departments, the actor responsible, and the transfer date.
    """
    __tablename__ = "department_transfers"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    from_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    to_department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=True)
    transfer_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    employee = relationship("app.models.employee_db.Employee")
    from_department = relationship("app.models.department_db.Department", foreign_keys=[from_department_id])
    to_department = relationship("app.models.department_db.Department", foreign_keys=[to_department_id])
    actor = relationship("app.models.user_db.User")
