from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import applications, auth, deadlines, schemes, users, wheel
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.app_name,
    description="Headless API for musikkorps-årshjul (støtte- og materialfrister).",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(schemes.router)
app.include_router(deadlines.router)
app.include_router(applications.router)
app.include_router(wheel.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": settings.app_name}
