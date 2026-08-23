from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import APP_NAME
from app.db import close_mongo, connect_mongo, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_mongo()
    yield
    await close_mongo()


app = FastAPI(title=APP_NAME, lifespan=lifespan)


@app.get("/health")
async def health():
    db = get_db()
    collections = sorted(await db.list_collection_names())
    return {"status": "ok", "database": db.name, "collections": collections}
