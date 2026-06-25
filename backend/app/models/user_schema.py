from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    """
    Base Pydantic schema containing core user attributes.
    """
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
    """
    Pydantic schema for creating a new user account.
    """
    password: str

class Token(BaseModel):
    """
    Pydantic schema representing an authentication token response.
    """
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """
    Pydantic schema containing the payload data stored within a token.
    """
    email: str | None = None

class UserUpdate(UserBase):
    """
    Pydantic schema for updating a user's profile.
    """
    pass

class UserResponse(UserBase):
    """
    Pydantic schema for returning user data.
    """
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
    """
    Pydantic schema for processing a password reset request.
    """
    email: EmailStr
    new_password: str

class RoleRequestCreate(BaseModel):
    """
    Pydantic schema for requesting a role change.
    """
    current_password: str
    admin_email: EmailStr

class RoleRequestUpdate(BaseModel):
    """
    Pydantic schema for updating a role request status.
    """
    status: str

class RoleRequestResponse(BaseModel):
    """
    Pydantic schema for returning role request details.
    """
    id: int
    user_id: int
    admin_email: str
    status: str
    user_name: str | None = None
    user_email: str | None = None

    class Config:
        from_attributes = True

class InvitationCreate(BaseModel):
    """
    Pydantic schema for creating a new user invitation.
    """
    email: EmailStr
    role: str | None = "Employee"


class ReactivationRequestCreate(BaseModel):
    """
    Pydantic schema for requesting account reactivation.
    """
    reason: str | None = ""


class ReactivationRequestUpdate(BaseModel):
    """
    Pydantic schema for updating a reactivation request.
    """
    status: str


class ReactivationRequestResponse(BaseModel):
    """
    Pydantic schema for returning reactivation request data.
    """
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
    """
    Pydantic schema for returning invitation details.
    """
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

class ReinstatementRequestCreate(BaseModel):
    """
    Pydantic schema for requesting account reinstatement.
    """
    reason: str | None = ""

class ReinstatementRequestUpdate(BaseModel):
    """
    Pydantic schema for updating account reinstatement status.
    """
    status: str

class ReinstatementRequestResponse(BaseModel):
    """
    Pydantic schema for returning reinstatement request details.
    """
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

class SuspendUserRequest(BaseModel):
    """
    Pydantic schema for submitting a user suspension request.
    """
    reason: str

class SuspensionDetailsResponse(BaseModel):
    """
    Pydantic schema for returning details about a user's suspension.
    """
    status: str
    suspended_at: datetime | None = None
    suspension_reason: str | None = None
    suspended_by_name: str | None = None
    suspended_by_email: str | None = None
