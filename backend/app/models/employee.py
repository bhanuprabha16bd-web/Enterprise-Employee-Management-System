from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List

class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int

    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    status: str = "Active"
    joinDate: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    department_id: int

class EmployeeResponse(EmployeeBase):
    id: int
    department: str

    @field_validator('department', mode='before')
    @classmethod
    def extract_department_name(cls, v):
        if hasattr(v, 'name'):
            return v.name
        return v

    class Config:
        from_attributes = True

