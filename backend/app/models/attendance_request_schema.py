from datetime import datetime
from pydantic import BaseModel

class AttendanceRequestResponse(BaseModel):
    """
    Pydantic schema for returning attendance request details.
    """
    """
    Response schema for an attendance request, exposing details such as status,
    and associated user name and email.
    """
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
    """
    Pydantic schema for updating the status of an attendance access request.
    """
    """
    Schema for updating the status of an existing attendance request.
    """
    status: str
