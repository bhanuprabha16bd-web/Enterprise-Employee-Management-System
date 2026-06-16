from datetime import datetime
from pydantic import BaseModel

class AttendanceRequestResponse(BaseModel):
    id: int
    user_id: int
    company_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    user_name: str | None = None
    user_email: str | None = None

    class Config:
        from_attributes = True

class AttendanceRequestUpdate(BaseModel):
    status: str
