from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import user_db, user_schema

def get_users(db: Session):
    return db.query(user_db.User).all()

def get_user(db: Session, user_id: int):
    user = db.query(user_db.User).filter(user_db.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def create_user(db: Session, user: user_schema.UserCreate):
    existing_user = db.query(user_db.User).filter(user_db.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    new_user = user_db.User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def update_user(db: Session, user_id: int, updated_user: user_schema.UserUpdate):
    user = db.query(user_db.User).filter(user_db.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = updated_user.name
    user.email = updated_user.email
    user.role = updated_user.role
    user.bio = updated_user.bio
    user.company = updated_user.company
    user.website = updated_user.website
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(user_db.User).filter(user_db.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
