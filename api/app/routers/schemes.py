from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.models import SupportScheme, User
from app.schemas import SchemeCreate, SchemeOut, SchemeUpdate

router = APIRouter(prefix="/api/schemes", tags=["schemes"])


@router.get("", response_model=list[SchemeOut])
def list_schemes(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[SupportScheme]:
    q = db.query(SupportScheme).order_by(SupportScheme.name)
    if not include_inactive:
        q = q.filter(SupportScheme.is_active.is_(True))
    return q.all()


@router.post("", response_model=SchemeOut, status_code=status.HTTP_201_CREATED)
def create_scheme(
    body: SchemeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> SupportScheme:
    scheme = SupportScheme(**body.model_dump())
    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    return scheme


@router.get("/{scheme_id}", response_model=SchemeOut)
def get_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> SupportScheme:
    scheme = db.query(SupportScheme).filter(SupportScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Støtteordning ikke funnet")
    return scheme


@router.patch("/{scheme_id}", response_model=SchemeOut)
def update_scheme(
    scheme_id: int,
    body: SchemeUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> SupportScheme:
    scheme = db.query(SupportScheme).filter(SupportScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Støtteordning ikke funnet")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(scheme, key, value)
    db.commit()
    db.refresh(scheme)
    return scheme


@router.delete("/{scheme_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    scheme = db.query(SupportScheme).filter(SupportScheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Støtteordning ikke funnet")
    db.delete(scheme)
    db.commit()
