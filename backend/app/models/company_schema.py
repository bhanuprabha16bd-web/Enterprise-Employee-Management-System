from pydantic import BaseModel

class CompanyBase(BaseModel):
    """
    Base Pydantic schema containing core company attributes.
    """
    """
    Base schema for company properties, used for common attributes.
    """
    name: str

class CompanyCreate(CompanyBase):
    """
    Pydantic schema defining the structure for creating a new company.
    """
    """
    Schema for creating a new company. Inherits common attributes from CompanyBase.
    """
    pass

class CompanyResponse(CompanyBase):
    """
    Pydantic schema for returning company details.
    """
    """
    Response schema for retrieving company details, including basic info
    along with calculated totals for employees and users.
    """
    id: int
    total_employees: int = 0
    total_users: int = 0

    class Config:
        from_attributes = True

class ExtendedCompanyResponse(BaseModel):
    """
    Extended Pydantic schema for company details including related data.
    """
    """
    Extended response schema providing additional computed data for companies,
    such as slug and counts, potentially used in admin or dashboard views.
    """
    _id: int
    id: int
    name: str
    slug: str
    employeeCount: int
    userCount: int
    isCurrentCompany: bool
    total_employees: int
    total_users: int
