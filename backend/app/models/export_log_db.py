from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database.config import Base

class ExportLog(Base):
    """
    SQLAlchemy model representing a log of a data export operation performed by a user.
    """
    """
    Database model tracking data export events.
    Records which user exported what entity type and in which format.
    """
    __tablename__ = "export_logs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    entity_type = Column(String)
    export_format = Column(String)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User")
    company = relationship("Company")
