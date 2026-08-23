from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import APP_NAME
from app.db import close_mongo, connect_mongo, get_db
from app.errors import register_error_handlers
from app.routers import auth, core, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    yield
    await close_mongo()


app = FastAPI(title=APP_NAME, lifespan=lifespan)

register_error_handlers(app)
app.include_router(auth.router)
app.include_router(core.router)
app.include_router(reports.router)


@app.get("/health")
async def health():
    db = get_db()
    collections = sorted(await db.list_collection_names())
    return {"status": "ok", "database": db.name, "collections": collections}
