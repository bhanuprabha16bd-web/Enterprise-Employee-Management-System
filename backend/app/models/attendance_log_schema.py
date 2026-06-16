from datetime import datetime, date
from pydantic import BaseModel
from typing import Optional

class AttendanceLogResponse(BaseModel):
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
    pass
