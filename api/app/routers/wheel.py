from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import WheelResponse
from app.services.wheel import build_wheel

router = APIRouter(prefix="/api/wheel", tags=["wheel"])


@router.get("", response_model=WheelResponse)
def get_wheel(
    year: int = Query(default=None, ge=2000, le=2100),
    ensure_applications: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> WheelResponse:
    target_year = year or date.today().year
    return build_wheel(db, target_year, ensure=ensure_applications)
