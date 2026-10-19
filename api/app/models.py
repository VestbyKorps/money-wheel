from __future__ import annotations

import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    member = "member"


class SupportKind(str, enum.Enum):
    money = "money"
    material = "material"
    both = "both"


class Recurrence(str, enum.Enum):
    yearly = "yearly"
    once = "once"


class ApplicationStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"
    skipped = "skipped"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.member, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    assigned_applications: Mapped[list[Application]] = relationship(back_populates="assignee")


class SupportScheme(Base):
    """A funding/material support programme the corps can apply to."""

    __tablename__ = "support_schemes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str] = mapped_column(String(255), nullable=False)
    kind: Mapped[SupportKind] = mapped_column(Enum(SupportKind), default=SupportKind.money)
    description: Mapped[str] = mapped_column(Text, default="")
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    deadlines: Mapped[list[Deadline]] = relationship(back_populates="scheme", cascade="all, delete-orphan")


class Deadline(Base):
    """A (possibly recurring) application window on the year wheel."""

    __tablename__ = "deadlines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("support_schemes.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    recurrence: Mapped[Recurrence] = mapped_column(Enum(Recurrence), default=Recurrence.yearly)
    # For yearly: month/day of deadline; for once: use absolute_deadline
    month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    absolute_deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Days before deadline when application typically opens (informational)
    opens_days_before: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reminder_days: Mapped[str] = mapped_column(String(100), default="30,14,7")  # CSV of ints
    checklist: Mapped[str] = mapped_column(Text, default="")  # newline-separated prep items
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    scheme: Mapped[SupportScheme] = relationship(back_populates="deadlines")
    applications: Mapped[list[Application]] = relationship(back_populates="deadline", cascade="all, delete-orphan")


class Application(Base):
    """One year's tracking instance for a deadline."""

    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("deadline_id", "year", name="uq_deadline_year"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    deadline_id: Mapped[int] = mapped_column(ForeignKey("deadlines.id", ondelete="CASCADE"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus), default=ApplicationStatus.not_started
    )
    assignee_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    amount_requested: Mapped[float | None] = mapped_column(Float, nullable=True)
    amount_granted: Mapped[float | None] = mapped_column(Float, nullable=True)
    submitted_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    deadline: Mapped[Deadline] = relationship(back_populates="applications")
    assignee: Mapped[User | None] = relationship(back_populates="assigned_applications")
