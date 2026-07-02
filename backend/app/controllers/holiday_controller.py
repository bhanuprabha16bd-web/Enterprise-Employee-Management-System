from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date
import calendar

from app.models.holiday_db import Holiday
from app.models.holiday_schema import HolidayCreate, HolidayUpdate
from app.controllers.audit_controller import create_audit_log
from app.models.user_db import User

def _holiday_action_description(action: str, holiday: Holiday) -> str:
    return (
        f"{action}: company_id={holiday.company_id}; "
        f"holiday_name='{holiday.name}'; holiday_date={holiday.date}; "
        f"holiday_type={holiday.type}; recurring={holiday.recurring}"
    )

def _date_applies_to_year(holiday_date: date, year: int) -> date:
    if holiday_date.month == 2 and holiday_date.day == 29 and not calendar.isleap(year):
        return date(year, 2, 28)
    return holiday_date.replace(year=year)

def holiday_applies_on(holiday: Holiday, target_date: date) -> bool:
    if holiday.date == target_date:
        return True
    return (
        holiday.recurring
        and holiday.date <= target_date
        and holiday.date.month == target_date.month
        and holiday.date.day == target_date.day
    )

def get_holiday_for_date(db: Session, company_id: int, target_date: date):
    holiday = db.query(Holiday).filter(
        Holiday.company_id == company_id,
        Holiday.date == target_date
    ).first()
    if holiday:
        return holiday

    recurring_holidays = db.query(Holiday).filter(
        Holiday.company_id == company_id,
        Holiday.recurring == True,
        Holiday.date <= target_date
    ).all()

    for holiday in recurring_holidays:
        if holiday_applies_on(holiday, target_date):
            return holiday

    return None

def create_holiday(db: Session, holiday_in: HolidayCreate, current_user: User):
    # Check for duplicate holiday on the same date for this company
    existing = db.query(Holiday).filter(
        Holiday.company_id == current_user.company_id,
        Holiday.date == holiday_in.date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A holiday already exists on this date.")
        
    holiday = Holiday(
        company_id=current_user.company_id,
        name=holiday_in.name,
        date=holiday_in.date,
        description=holiday_in.description,
        type=holiday_in.type,
        recurring=holiday_in.recurring
    )
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    create_audit_log(
        db=db,
        event_type="Holiday Created",
        description=_holiday_action_description("Holiday Created", holiday),
        actor_id=current_user.id,
        company_id=current_user.company_id
    )
    return holiday

def update_holiday(db: Session, holiday_id: int, holiday_in: HolidayUpdate, current_user: User):
    holiday = db.query(Holiday).filter(
        Holiday.id == holiday_id,
        Holiday.company_id == current_user.company_id
    ).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")

    if holiday_in.date is not None and holiday_in.date != holiday.date:
        existing = db.query(Holiday).filter(
            Holiday.company_id == current_user.company_id,
            Holiday.date == holiday_in.date,
            Holiday.id != holiday_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="A holiday already exists on this date.")

    update_data = holiday_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(holiday, key, value)
        
    db.commit()
    db.refresh(holiday)
    
    create_audit_log(
        db=db,
        event_type="Holiday Updated",
        description=_holiday_action_description("Holiday Updated", holiday),
        actor_id=current_user.id,
        company_id=current_user.company_id
    )
    return holiday

def delete_holiday(db: Session, holiday_id: int, current_user: User):
    holiday = db.query(Holiday).filter(
        Holiday.id == holiday_id,
        Holiday.company_id == current_user.company_id
    ).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
        
    db.delete(holiday)
    db.commit()
    create_audit_log(
        db=db,
        event_type="Holiday Deleted",
        description=_holiday_action_description("Holiday Deleted", holiday),
        actor_id=current_user.id,
        company_id=current_user.company_id
    )
    return {"message": "Holiday deleted successfully"}

def get_holidays(db: Session, company_id: int, year: int = None, month: int = None):
    query = db.query(Holiday).filter(Holiday.company_id == company_id)
    holidays = query.order_by(Holiday.date.asc()).all()
    
    result = []
    # If year/month filtering is provided, handle recurring holidays logically
    for h in holidays:
        # If no year is specified, return all
        if not year:
            result.append(h)
            continue
            
        h_year = h.date.year
        h_month = h.date.month
        
        # Does it match the year?
        if h_year == year:
            if month is None or h_month == month:
                result.append(h)
        elif h.recurring and h_year < year:
            # Recurring holiday from a previous year applies to this year
            if month is None or h_month == month:
                # We optionally could create a temporary object here with updated date,
                # but it's simpler to just return it as is, or reconstruct the date.
                # Let's clone and update the date to the queried year so the UI handles it easily.
                try:
                    new_date = _date_applies_to_year(h.date, year)
                    # Use a shallow copy or just create a dict representing it
                    h_dict = {
                        "id": h.id,
                        "company_id": h.company_id,
                        "name": h.name,
                        "date": new_date,
                        "description": h.description,
                        "type": h.type,
                        "recurring": h.recurring,
                        "created_at": h.created_at,
                        "updated_at": h.updated_at,
                    }
                    result.append(h_dict)
                except ValueError:
                    new_date = date(year, h.date.month, min(h.date.day, calendar.monthrange(year, h.date.month)[1]))
                    h_dict = {
                        "id": h.id,
                        "company_id": h.company_id,
                        "name": h.name,
                        "date": new_date,
                        "description": h.description,
                        "type": h.type,
                        "recurring": h.recurring,
                        "created_at": h.created_at,
                        "updated_at": h.updated_at,
                    }
                    result.append(h_dict)

    # Note: result contains a mix of ORM objects and dicts. Pydantic can handle both, but we should make sure we return consistently.
    # Actually, if year is not provided, we just returned `h` (ORM objects).
    # Since FastAPI uses Pydantic's from_orm (from_attributes), it works with ORM objects. For dicts, it also works if it's a dict. 
    return result

def get_holiday_today(db: Session, company_id: int):
    today = date.today()
    return get_holiday_for_date(db, company_id, today)
