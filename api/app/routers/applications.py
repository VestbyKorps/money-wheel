from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.models import Application, Deadline, User, UserRole
from app.schemas import ApplicationCreate, ApplicationOut, ApplicationUpdate

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _load(db: Session, application_id: int) -> Application | None:
    return (
        db.query(Application)
        .options(
            joinedload(Application.assignee),
            joinedload(Application.deadline).joinedload(Deadline.scheme),
        )
        .filter(Application.id == application_id)
        .first()
    )


@router.get("", response_model=list[ApplicationOut])
def list_applications(
    year: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Application]:
    q = db.query(Application).options(
        joinedload(Application.assignee),
        joinedload(Application.deadline).joinedload(Deadline.scheme),
    )
    if year is not None:
        q = q.filter(Application.year == year)
    return q.order_by(Application.year.desc()).all()


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    body: ApplicationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> Application:
    if not db.query(Deadline).filter(Deadline.id == body.deadline_id).first():
        raise HTTPException(status_code=400, detail="Ugyldig frist")
    existing = (
        db.query(Application)
        .filter(Application.deadline_id == body.deadline_id, Application.year == body.year)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Søknad for dette året finnes allerede")
    if body.assignee_id and not db.query(User).filter(User.id == body.assignee_id).first():
        raise HTTPException(status_code=400, detail="Ugyldig ansvarlig")
    app = Application(**body.model_dump())
    db.add(app)
    db.commit()
    return _load(db, app.id)


@router.patch("/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: int,
    body: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Application:
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Søknad ikke funnet")

    data = body.model_dump(exclude_unset=True)
    # Members can update status/notes/amounts on assigned apps; admins can update all
    if current_user.role != UserRole.admin:
        if app.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Du kan bare oppdatere søknader du er ansvarlig for")
        allowed = {"status", "amount_requested", "amount_granted", "submitted_at", "notes"}
        data = {k: v for k, v in data.items() if k in allowed}

    if "assignee_id" in data and data["assignee_id"] is not None:
        if not db.query(User).filter(User.id == data["assignee_id"]).first():
            raise HTTPException(status_code=400, detail="Ugyldig ansvarlig")

    for key, value in data.items():
        setattr(app, key, value)
    db.commit()
    return _load(db, application_id)
