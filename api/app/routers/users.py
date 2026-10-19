from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, hash_password, require_admin
from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[User]:
    return db.query(User).order_by(User.full_name).all()


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> User:
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="E-post er allerede i bruk")
    user = User(
        email=body.email.lower().strip(),
        full_name=body.full_name.strip(),
        hashed_password=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Bruker ikke funnet")

    data = body.model_dump(exclude_unset=True)
    if "password" in data:
        user.hashed_password = hash_password(data.pop("password"))
    if "email" in data and data["email"]:
        email = data["email"].lower().strip()
        conflict = db.query(User).filter(User.email == email, User.id != user_id).first()
        if conflict:
            raise HTTPException(status_code=400, detail="E-post er allerede i bruk")
        data["email"] = email
    if "full_name" in data and data["full_name"]:
        data["full_name"] = data["full_name"].strip()

    # Prevent last admin from demoting/deactivating themselves
    if user.id == current_admin.id:
        new_role = data.get("role", user.role)
        new_active = data.get("is_active", user.is_active)
        if new_role != UserRole.admin or new_active is False:
            admin_count = db.query(User).filter(User.role == UserRole.admin, User.is_active.is_(True)).count()
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Kan ikke fjerne siste aktive administrator")

    for key, value in data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


@router.get("/directory", response_model=list[UserOut])
def user_directory(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[User]:
    """Active users for assignee pickers (all authenticated roles)."""
    return db.query(User).filter(User.is_active.is_(True)).order_by(User.full_name).all()
