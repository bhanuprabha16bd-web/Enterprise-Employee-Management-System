from pydantic import BaseModel

class CompanyBase(BaseModel):
    name: str

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    total_employees: int = 0
    total_users: int = 0

    class Config:
        from_attributes = True

class ExtendedCompanyResponse(BaseModel):
    _id: int
    id: int
    name: str
    slug: str
    employeeCount: int
    userCount: int
    isCurrentCompany: bool
    total_employees: int
    total_users: int
