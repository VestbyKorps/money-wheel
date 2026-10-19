from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import ApplicationStatus, Recurrence, SupportKind, UserRole


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Users
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    role: UserRole = UserRole.member


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    password: str | None = Field(default=None, min_length=6, max_length=128)
    role: UserRole | None = None
    is_active: bool | None = None


class UserOut(OrmModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime


# Schemes
class SchemeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    provider: str = Field(min_length=1, max_length=255)
    kind: SupportKind = SupportKind.money
    description: str = ""
    website_url: str | None = None
    notes: str = ""
    is_active: bool = True


class SchemeUpdate(BaseModel):
    name: str | None = None
    provider: str | None = None
    kind: SupportKind | None = None
    description: str | None = None
    website_url: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class SchemeOut(OrmModel):
    id: int
    name: str
    provider: str
    kind: SupportKind
    description: str
    website_url: str | None
    notes: str
    is_active: bool
    created_at: datetime


# Deadlines
class DeadlineCreate(BaseModel):
    scheme_id: int
    title: str = Field(min_length=1, max_length=255)
    recurrence: Recurrence = Recurrence.yearly
    month: int | None = Field(default=None, ge=1, le=12)
    day: int | None = Field(default=None, ge=1, le=31)
    absolute_deadline: date | None = None
    opens_days_before: int | None = Field(default=None, ge=0, le=365)
    reminder_days: str = "30,14,7"
    checklist: str = ""
    is_active: bool = True


class DeadlineUpdate(BaseModel):
    scheme_id: int | None = None
    title: str | None = None
    recurrence: Recurrence | None = None
    month: int | None = Field(default=None, ge=1, le=12)
    day: int | None = Field(default=None, ge=1, le=31)
    absolute_deadline: date | None = None
    opens_days_before: int | None = Field(default=None, ge=0, le=365)
    reminder_days: str | None = None
    checklist: str | None = None
    is_active: bool | None = None


class DeadlineOut(OrmModel):
    id: int
    scheme_id: int
    title: str
    recurrence: Recurrence
    month: int | None
    day: int | None
    absolute_deadline: date | None
    opens_days_before: int | None
    reminder_days: str
    checklist: str
    is_active: bool
    created_at: datetime
    scheme: SchemeOut | None = None


# Applications
class ApplicationCreate(BaseModel):
    deadline_id: int
    year: int = Field(ge=2000, le=2100)
    status: ApplicationStatus = ApplicationStatus.not_started
    assignee_id: int | None = None
    amount_requested: float | None = None
    amount_granted: float | None = None
    submitted_at: date | None = None
    notes: str = ""


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None
    assignee_id: int | None = None
    amount_requested: float | None = None
    amount_granted: float | None = None
    submitted_at: date | None = None
    notes: str | None = None


class ApplicationOut(OrmModel):
    id: int
    deadline_id: int
    year: int
    status: ApplicationStatus
    assignee_id: int | None
    amount_requested: float | None
    amount_granted: float | None
    submitted_at: date | None
    notes: str
    created_at: datetime
    updated_at: datetime | None = None
    deadline: DeadlineOut | None = None
    assignee: UserOut | None = None


# Year wheel
class WheelItem(BaseModel):
    deadline_id: int
    scheme_id: int
    scheme_name: str
    provider: str
    kind: SupportKind
    title: str
    year: int
    deadline_date: date
    opens_date: date | None
    days_until: int
    reminder_days: list[int]
    checklist: str
    application: ApplicationOut | None = None


class WheelResponse(BaseModel):
    year: int
    items: list[WheelItem]
