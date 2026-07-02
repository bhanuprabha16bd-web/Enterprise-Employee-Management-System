from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class HolidayCreate(BaseModel):
    name: str
    date: date
    description: Optional[str] = None
    type: str  # "Public Holiday", "Company Holiday", "Optional Holiday"
    recurring: bool = False

class HolidayUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    type: Optional[str] = None
    recurring: Optional[bool] = None

class HolidayResponse(BaseModel):
    id: int
    company_id: int
    name: str
    date: date
    description: Optional[str] = None
    type: str
    recurring: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
