from pydantic import BaseModel
from datetime import datetime

class NotificationResponse(BaseModel):
    """
    Pydantic schema for returning notification data to the client.
    """
    id: int
    user_email: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
