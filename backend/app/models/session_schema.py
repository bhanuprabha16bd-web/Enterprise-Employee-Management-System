from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SessionBase(BaseModel):
    device_name: Optional[str] = None
    browser: Optional[str] = None
    ip_address: Optional[str] = None

class SessionResponse(SessionBase):
    id: int
    user_id: int
    company_id: int
    login_time: datetime
    last_activity: datetime
    status: str
    trusted: bool
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

class SessionRename(BaseModel):
    device_name: str

class SessionRevokeList(BaseModel):
    session_ids: List[int]
