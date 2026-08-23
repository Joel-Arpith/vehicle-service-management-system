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


async def run_transaction(callback):
    """Run `callback(session)` inside a multi-document ACID transaction.

    Requires a replica set — single-node `rs0` is enough locally.

    Uses the driver's `with_transaction`, which retries the callback when
    MongoDB labels a failure `TransientTransactionError`. That matters for
    concurrent writes to the same document: the loser of a race aborts with a
    *write conflict*, not with our domain error, and without a retry the API
    would answer 500 instead of a meaningful 409. On retry the callback
    re-reads the now-updated state and fails cleanly.

    Domain errors carry no retry label, so they propagate on the first raise.
    The callback must therefore be safe to run more than once — ours re-read
    everything they depend on.
    """
    if mongo.client is None:
        raise RuntimeError("MongoDB not connected")
    session = await mongo.client.start_session()
    try:
        return await session.with_transaction(callback)
    finally:
        await session.end_session()
