from motor.motor_asyncio import AsyncIOMotorClient

from app.config import MONGO_DB, MONGO_URI


class MongoState:
    client: AsyncIOMotorClient | None = None
    db = None


mongo = MongoState()


async def connect_mongo() -> None:
    mongo.client = AsyncIOMotorClient(MONGO_URI)
    await mongo.client.admin.command("ping")
    mongo.db = mongo.client[MONGO_DB]


async def close_mongo() -> None:
    if mongo.client is not None:
        mongo.client.close()
        mongo.client = None
        mongo.db = None


def get_db():
    if mongo.db is None:
        raise RuntimeError("MongoDB not connected")
    return mongo.db
