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
    attendance_access: bool = False
    created_at: datetime | None = None

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
    last_login: datetime | None = None
    last_logout: datetime | None = None
    last_ip_address: str | None = None
    last_browser: str | None = None
    is_new_device_login: bool = False
    is_new_ip_login: bool = False

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


class ReactivationRequestCreate(BaseModel):
    reason: str | None = ""


class ReactivationRequestUpdate(BaseModel):
    status: str


class ReactivationRequestResponse(BaseModel):
    id: int
    user_id: int
    company_id: int
    status: str
    reason: str | None = None
    user_name: str | None = None
    user_email: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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
