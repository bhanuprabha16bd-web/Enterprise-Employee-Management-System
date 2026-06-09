from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    status: str = "Active"
    bio: str | None = ""
    company_name: str | None = ""
    website: str | None = ""

class UserCreate(UserBase):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class UserUpdate(UserBase):
    pass

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str

class RoleRequestCreate(BaseModel):
    current_password: str
    admin_email: EmailStr

class RoleRequestUpdate(BaseModel):
    status: str

class RoleRequestResponse(BaseModel):
    id: int
    user_id: int
    admin_email: str
    status: str
    user_name: str | None = None
    user_email: str | None = None

    class Config:
        from_attributes = True

class InvitationCreate(BaseModel):
    email: EmailStr
    role: str | None = "Employee"

class InvitationResponse(BaseModel):
    id: int
    email: EmailStr
    token: str
    status: str
    role: str
    invited_by: int
    company_id: int
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True
