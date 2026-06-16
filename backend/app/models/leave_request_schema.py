from datetime import datetime, date
from pydantic import BaseModel
from typing import Optional

class LeaveRequestCreate(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveRequestUpdate(BaseModel):
    status: str

class LeaveRequestResponse(BaseModel):
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
