from pydantic import BaseModel
from datetime import datetime

class AuditLogResponse(BaseModel):
    """
    Pydantic schema for returning audit log data to the client.
    """
    """
    Response schema for audit log entries, providing event details
    and information about the actor who triggered the event.
    """
    id: int
    event_type: str
    description: str
    actor_id: int
    actor_name: str | None = None
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True
