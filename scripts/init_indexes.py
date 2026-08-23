import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import MONGO_DB, MONGO_URI


async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB]
    collections = await db.list_collection_names()
    print(f"connected to {MONGO_DB}; existing collections: {collections}")
    print("week 8: add $jsonSchema validators and Section 6 index list here")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
