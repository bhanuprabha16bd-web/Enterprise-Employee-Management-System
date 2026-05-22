from pydantic import BaseModel
from typing import Optional

class Employee(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: str
    status: str
    joinDate: str
    avatar: str
    phone: str
    location: str
