from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.config import SessionLocal
from app.models import user_schema
from app.controllers import user_controller

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[user_schema.UserResponse])
def get_users(db: Session = Depends(get_db)):
    return user_controller.get_users(db)

@router.get("/{user_id}", response_model=user_schema.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return user_controller.get_user(db, user_id)

@router.post("/", response_model=user_schema.UserResponse)
def create_user(user: user_schema.UserCreate, db: Session = Depends(get_db)):
    return user_controller.create_user(db, user)

@router.put("/{user_id}", response_model=user_schema.UserResponse)
def update_user(user_id: int, updated_user: user_schema.UserUpdate, db: Session = Depends(get_db)):
    return user_controller.update_user(db, user_id, updated_user)

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    return user_controller.delete_user(db, user_id)

@router.post("/login", response_model=user_schema.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    from app.auth import create_access_token
    user = user_controller.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/reset-password")
def reset_password(reset_data: user_schema.PasswordReset, db: Session = Depends(get_db)):
    return user_controller.reset_password(db, reset_data)
