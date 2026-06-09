from pydantic import BaseModel
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    event_type: str
    description: str
    actor_id: int
    actor_name: str | None = None
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True
