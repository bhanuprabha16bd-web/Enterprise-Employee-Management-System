import os
from datetime import datetime, timedelta
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.config import SessionLocal
from app.models import user_db, user_schema

SECRET_KEY = "your-secret-key-for-jwt" # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.
    Returns True if they match, False otherwise.
    """
    # bcrypt requires bytes
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """
    Generate a bcrypt hash for a given password.
    Returns the hashed password as a string.
    """
    # bcrypt returns bytes, so decode to store as string
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    Create a new JWT access token with an optional expiration time.
    If expires_delta is not provided, defaults to 15 minutes.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    """
    Dependency generator that yields a database session and ensures
    it is closed after the request is completed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Retrieve the current user based on the provided JWT token.
    Validates the token, extracts the user's email, and fetches the user from the database.
    Raises HTTPException if validation fails or user is not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = user_schema.TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(user_db.User).filter(user_db.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
        
    session_token = payload.get("session_token")
    if session_token:
        from app.models.session_db import UserSession
        from datetime import datetime, timezone
        session = db.query(UserSession).filter(UserSession.session_token == session_token).first()
        if not session or session.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session is invalid or has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # update last activity optionally if it's older than e.g. 5 mins
        # but to avoid many DB writes on every request, we can just update it roughly
        # For simplicity, we update it directly (we should ideally do this async or periodically)
        session.last_activity = datetime.now(timezone.utc)
        db.commit()

    return user

def get_active_user(current_user: user_db.User = Depends(get_current_user)):
    """
    Dependency to ensure the current authenticated user has an active status.
    Raises HTTPException if the account is suspended or deactivated.
    """
    if current_user.status == "Suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )
    if current_user.status == "Inactive" or current_user.status == "Deactivated":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return current_user
