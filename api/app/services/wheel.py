from __future__ import annotations

from calendar import monthrange
from datetime import date, timedelta

from sqlalchemy.orm import Session, joinedload

from app.models import Application, Deadline, Recurrence
from app.schemas import ApplicationOut, WheelItem, WheelResponse


def parse_reminder_days(raw: str) -> list[int]:
    days: list[int] = []
    for part in (raw or "").split(","):
        part = part.strip()
        if not part:
            continue
        try:
            days.append(int(part))
        except ValueError:
            continue
    return sorted({d for d in days if d >= 0}, reverse=True)


def deadline_date_for_year(deadline: Deadline, year: int) -> date | None:
    if deadline.recurrence == Recurrence.once:
        if deadline.absolute_deadline is None:
            return None
        if deadline.absolute_deadline.year != year:
            return None
        return deadline.absolute_deadline

    if deadline.month is None or deadline.day is None:
        return None
    last_day = monthrange(year, deadline.month)[1]
    day = min(deadline.day, last_day)
    return date(year, deadline.month, day)


def ensure_application(db: Session, deadline: Deadline, year: int) -> Application:
    existing = (
        db.query(Application)
        .filter(Application.deadline_id == deadline.id, Application.year == year)
        .first()
    )
    if existing:
        return existing
    app = Application(deadline_id=deadline.id, year=year)
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


def build_wheel(db: Session, year: int, ensure: bool = True) -> WheelResponse:
    deadlines = (
        db.query(Deadline)
        .options(joinedload(Deadline.scheme), joinedload(Deadline.applications))
        .filter(Deadline.is_active.is_(True))
        .all()
    )
    today = date.today()
    items: list[WheelItem] = []

    for deadline in deadlines:
        if not deadline.scheme or not deadline.scheme.is_active:
            continue
        due = deadline_date_for_year(deadline, year)
        if due is None:
            continue

        application = next((a for a in deadline.applications if a.year == year), None)
        if application is None and ensure:
            application = ensure_application(db, deadline, year)
            # re-attach for serialization
            application = (
                db.query(Application)
                .options(joinedload(Application.assignee), joinedload(Application.deadline))
                .filter(Application.id == application.id)
                .first()
            )

        opens_date = None
        if deadline.opens_days_before is not None:
            opens_date = due - timedelta(days=deadline.opens_days_before)

        app_out = None
        if application is not None:
            app_out = ApplicationOut.model_validate(application)

        items.append(
            WheelItem(
                deadline_id=deadline.id,
                scheme_id=deadline.scheme_id,
                scheme_name=deadline.scheme.name,
                provider=deadline.scheme.provider,
                kind=deadline.scheme.kind,
                title=deadline.title,
                year=year,
                deadline_date=due,
                opens_date=opens_date,
                days_until=(due - today).days,
                reminder_days=parse_reminder_days(deadline.reminder_days),
                checklist=deadline.checklist or "",
                application=app_out,
            )
        )

    items.sort(key=lambda i: i.deadline_date)
    return WheelResponse(year=year, items=items)
