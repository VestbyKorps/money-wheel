from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth import authenticate_user, create_access_token, get_current_user
from app.database import get_db
from app.schemas import LoginRequest, Token, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    # OAuth2 form uses "username" field for email
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Feil e-post eller passord")
    return Token(access_token=create_access_token(user.email))


@router.post("/login/json", response_model=Token)
def login_json(body: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Feil e-post eller passord")
    return Token(access_token=create_access_token(user.email))


@router.get("/me", response_model=UserOut)
def me(current_user=Depends(get_current_user)) -> UserOut:
    return current_user
