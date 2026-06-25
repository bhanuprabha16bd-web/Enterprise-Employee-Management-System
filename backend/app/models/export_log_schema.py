from pydantic import BaseModel
from datetime import datetime

class ExportLogBase(BaseModel):
    """
    Base Pydantic schema for export log entries.
    """
    """
    Base schema for export logs, detailing the entity type and format exported.
    """
    entity_type: str
    export_format: str

class ExportLogCreate(ExportLogBase):
    """
    Pydantic schema for recording a new export operation.
    """
    """
    Schema used when creating a new export log entry.
    """
    pass

class ExportLogResponse(ExportLogBase):
    """
    Pydantic schema for returning export log records.
    """
    """
    Response schema for an export log, including the log's ID and timestamp.
    """
    id: int
    company_id: int
    user_id: int
    created_at: datetime
    
    # We might want to include the user's name who exported it
    # We can do this by adding a user_name field or similar, or just returning user details
    # For now, let's just return the basic fields, but since we need "Who Exported", we can extend it.
    
    class Config:
        from_attributes = True

class ExportLogWithUserResponse(ExportLogResponse):
    """
    Pydantic schema for returning export logs including details of the user who performed it.
    """
    """
    Extended response schema that includes the user's name and email for context.
    """
    user_name: str
    user_email: str

    class Config:
        from_attributes = True
