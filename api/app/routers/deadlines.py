from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.models import Deadline, Recurrence, SupportScheme, User
from app.schemas import DeadlineCreate, DeadlineOut, DeadlineUpdate

router = APIRouter(prefix="/api/deadlines", tags=["deadlines"])


def _validate_deadline_fields(body_recurrence, month, day, absolute_deadline) -> None:
    if body_recurrence == Recurrence.yearly:
        if month is None or day is None:
            raise HTTPException(status_code=400, detail="Årlige frister krever måned og dag")
    elif body_recurrence == Recurrence.once:
        if absolute_deadline is None:
            raise HTTPException(status_code=400, detail="Engangsfrister krever absolutt dato")


@router.get("", response_model=list[DeadlineOut])
def list_deadlines(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Deadline]:
    q = db.query(Deadline).options(joinedload(Deadline.scheme)).order_by(Deadline.month, Deadline.day)
    if not include_inactive:
        q = q.filter(Deadline.is_active.is_(True))
    return q.all()


@router.post("", response_model=DeadlineOut, status_code=status.HTTP_201_CREATED)
def create_deadline(
    body: DeadlineCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Deadline:
    if not db.query(SupportScheme).filter(SupportScheme.id == body.scheme_id).first():
        raise HTTPException(status_code=400, detail="Ugyldig støtteordning")
    _validate_deadline_fields(body.recurrence, body.month, body.day, body.absolute_deadline)
    deadline = Deadline(**body.model_dump())
    db.add(deadline)
    db.commit()
    deadline = (
        db.query(Deadline).options(joinedload(Deadline.scheme)).filter(Deadline.id == deadline.id).first()
    )
    return deadline


@router.patch("/{deadline_id}", response_model=DeadlineOut)
def update_deadline(
    deadline_id: int,
    body: DeadlineUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Deadline:
    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    if not deadline:
        raise HTTPException(status_code=404, detail="Frist ikke funnet")
    data = body.model_dump(exclude_unset=True)
    if "scheme_id" in data and not db.query(SupportScheme).filter(SupportScheme.id == data["scheme_id"]).first():
        raise HTTPException(status_code=400, detail="Ugyldig støtteordning")

    recurrence = data.get("recurrence", deadline.recurrence)
    month = data.get("month", deadline.month)
    day = data.get("day", deadline.day)
    absolute = data.get("absolute_deadline", deadline.absolute_deadline)
    _validate_deadline_fields(recurrence, month, day, absolute)

    for key, value in data.items():
        setattr(deadline, key, value)
    db.commit()
    return (
        db.query(Deadline).options(joinedload(Deadline.scheme)).filter(Deadline.id == deadline_id).first()
    )


@router.delete("/{deadline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deadline(
    deadline_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    deadline = db.query(Deadline).filter(Deadline.id == deadline_id).first()
    if not deadline:
        raise HTTPException(status_code=404, detail="Frist ikke funnet")
    db.delete(deadline)
    db.commit()
