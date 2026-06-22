from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DepartmentTransferBase(BaseModel):
    from_department_id: Optional[int] = None
    to_department_id: int
    reason: Optional[str] = None

class DepartmentTransferCreate(DepartmentTransferBase):
    pass

class DepartmentTransferResponse(DepartmentTransferBase):
    id: int
    employee_id: int
    actor_id: int
    transfer_date: datetime
    
    from_department_name: Optional[str] = None
    to_department_name: Optional[str] = None
    actor_name: Optional[str] = None

    class Config:
        from_attributes = True
