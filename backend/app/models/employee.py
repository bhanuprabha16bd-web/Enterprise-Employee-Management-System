from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List

class DepartmentBase(BaseModel):
    """
    Base Pydantic schema for department attributes.
    """
    """
    Base schema for departments containing common attributes.
    """
    name: str

class DepartmentCreate(DepartmentBase):
    """
    Pydantic schema for creating a new department.
    """
    """
    Schema for creating a new department.
    """
    pass

class DepartmentResponse(DepartmentBase):
    """
    Pydantic schema for returning department data.
    """
    """
    Schema for the department response, containing its unique ID.
    """
    id: int

    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    """
    Base Pydantic schema containing core employee attributes.
    """
    """
    Base schema containing core employee attributes.
    """
    name: str
    email: EmailStr
    role: str
    status: str = "Active"
    joinDate: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    """
    Pydantic schema for creating a new employee record.
    """
    """
    Schema used when creating a new employee, requiring an associated department ID.
    """
    department_id: int

class EmployeeUpdate(BaseModel):
    """
    Pydantic schema for updating an existing employee's information.
    """
    """
    Schema for updating an employee's details. All fields are optional.
    """
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    status: Optional[str] = None
    joinDate: Optional[str] = None
    avatar: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    department_id: Optional[int] = None

class EmployeeResponse(EmployeeBase):
    """
    Pydantic schema for returning employee details.
    """
    """
    Response schema for an employee, expanding the base attributes
    with the employee's ID and resolved department name.
    """
    id: int
    department: Optional[str] = None

    @field_validator('department', mode='before')
    @classmethod
    def extract_department_name(cls, v):
        """
        Validator to extract the department name from a department object 
        or use the string value if already provided.
        """
        if not v:
            return None
        if hasattr(v, 'name'):
            return v.name
        return str(v)

    class Config:
        from_attributes = True

