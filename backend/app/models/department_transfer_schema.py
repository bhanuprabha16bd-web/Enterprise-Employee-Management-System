from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DepartmentTransferBase(BaseModel):
    """
    Base Pydantic schema for department transfer operations.
    """
    """
    Base schema for a department transfer, containing the core details of the movement.
    """
    from_department_id: Optional[int] = None
    to_department_id: int
    reason: Optional[str] = None

class DepartmentTransferCreate(DepartmentTransferBase):
    """
    Pydantic schema for initiating a department transfer.
    """
    """
    Schema used when creating a new department transfer record.
    """
    pass

class DepartmentTransferResponse(DepartmentTransferBase):
    """
    Pydantic schema for returning department transfer records.
    """
    """
    Response schema that includes the full context of a department transfer,
    such as resolved department names and the responsible actor's name.
    """
    id: int
    employee_id: int
    actor_id: int
    transfer_date: datetime
    
    from_department_name: Optional[str] = None
    to_department_name: Optional[str] = None
    actor_name: Optional[str] = None

    class Config:
        from_attributes = True
