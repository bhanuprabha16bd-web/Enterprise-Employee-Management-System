from datetime import datetime, date
from pydantic import BaseModel
from typing import Optional

class AttendanceLogResponse(BaseModel):
    """
    Pydantic schema for formatting attendance log responses sent to the client.
    """
    """
    Response schema for attendance logs, including details like check-in/out times,
    status, and related user/department information.
    """
    id: int
    user_id: int
    company_id: int
    date: date
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    total_hours: Optional[float] = None
    status: str
    created_at: datetime
    user_name: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceLogCheckOut(BaseModel):
    """
    Pydantic schema containing data required for a clock-out event.
    """
    """
    Schema for check-out operations. Currently empty, acting as a placeholder
    for future check-out specific fields.
    """
    pass
