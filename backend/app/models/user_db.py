from sqlalchemy import Column, Integer, String, ForeignKey
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

    website = Column(String)

    company = relationship("app.models.company_db.Company", back_populates="users")

    @property
    def company_name(self):
        return self.company.name if self.company else ""
