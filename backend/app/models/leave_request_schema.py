from datetime import datetime, date
from pydantic import BaseModel
from typing import Optional

class LeaveRequestCreate(BaseModel):
    """
    Pydantic schema for submitting a new leave request.
    """
    """
    Schema for creating a new leave request, containing required details
    such as dates and reason.
    """
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveRequestUpdate(BaseModel):
    """
    Pydantic schema for updating the status of a leave request.
    """
    """
    Schema for updating the approval status of a leave request.
    """
    status: str

class LeaveRequestResponse(BaseModel):
    """
    Pydantic schema for returning leave request details.
    """
    """
    Response schema returning the details of a leave request,
    including the user's name and department.
    """
    id: int
    user_id: int
    company_id: int
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None
    status: str
    created_at: datetime
    user_name: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True
