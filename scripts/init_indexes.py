"""Create collections, $jsonSchema validators and indexes.

This is the DDL equivalent for the report (plan Sections 4 and 6).
Idempotent — safe to re-run.

    python scripts/init_indexes.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING

from app.config import MONGO_DB, MONGO_URI

COLLECTIONS = [
    "customers", "vehicles", "bookings", "job_cards", "mechanics",
    "assignments", "spare_parts", "part_usage", "inspections",
    "invoices", "payments",
]

VALIDATORS = {
    "vehicles": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["registration_number", "customer_id", "make", "model", "created_at"],
            "properties": {
                "registration_number": {"bsonType": "string"},
                "customer_id": {"bsonType": "objectId"},
                "make": {"bsonType": "string"},
                "model": {"bsonType": "string"},
                "year": {"bsonType": ["int", "null"], "minimum": 1980, "maximum": 2100},
                "odometer": {"bsonType": ["int", "null"], "minimum": 0},
                "created_at": {"bsonType": "date"},
            },
        }
    },
    "assignments": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["mechanic_id", "job_card_id", "task_id", "start_time", "end_time", "status"],
            "properties": {
                "mechanic_id": {"bsonType": "objectId"},
                "job_card_id": {"bsonType": "objectId"},
                "task_id": {"bsonType": "objectId"},
                "start_time": {"bsonType": "date"},
                "end_time": {"bsonType": "date"},
                "status": {"enum": ["scheduled", "in_progress", "completed", "cancelled"]},
            },
        }
    },
    "spare_parts": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["name", "sku", "stock_qty", "unit_price"],
            "properties": {
                "name": {"bsonType": "string"},
                "sku": {"bsonType": "string"},
                # Backstop for the stock rule: even a buggy service layer
                # cannot drive stock negative past this validator.
                "stock_qty": {"bsonType": "int", "minimum": 0},
                "reorder_level": {"bsonType": "int", "minimum": 0},
                "unit_price": {"bsonType": ["double", "int"], "minimum": 0},
            },
        }
    },
    # Composite validators: $jsonSchema AND an $expr cross-field check.
    "bookings": {
        "$and": [
            {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["vehicle_id", "customer_id", "booking_date", "status"],
                    "properties": {
                        "vehicle_id": {"bsonType": "objectId"},
                        "customer_id": {"bsonType": "objectId"},
                        "booking_date": {"bsonType": "date"},
                        "expected_completion_date": {"bsonType": ["date", "null"]},
                        "actual_completion_date": {"bsonType": ["date", "null"]},
                        "status": {"enum": ["pending", "in_progress", "completed", "cancelled"]},
                    },
                }
            },
            {"$expr": {"$or": [
                {"$eq": [{"$type": "$expected_completion_date"}, "missing"]},
                {"$eq": ["$expected_completion_date", None]},
                {"$gte": ["$expected_completion_date", "$booking_date"]},
            ]}},
        ]
    },
    "invoices": {
        "$and": [
            {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["job_card_id", "customer_id", "line_items", "subtotal", "tax", "total"],
                    "properties": {
                        "job_card_id": {"bsonType": "objectId"},
                        "customer_id": {"bsonType": "objectId"},
                        "line_items": {
                            "bsonType": "array",
                            "items": {
                                "bsonType": "object",
                                "required": ["description", "amount"],
                                "properties": {
                                    "description": {"bsonType": "string"},
                                    "amount": {"bsonType": ["double", "int"], "minimum": 0},
                                },
                            },
                        },
                        "subtotal": {"bsonType": ["double", "int"]},
                        "tax": {"bsonType": ["double", "int"]},
                        "total": {"bsonType": ["double", "int"]},
                    },
                }
            },
            # Second line of defence on "accurate invoice totals": a document
            # whose total does not equal subtotal + tax is rejected by the DB.
            # Rounded to paise so float noise doesn't trip it.
            {"$expr": {"$eq": [
                {"$round": ["$total", 2]},
                {"$round": [{"$add": ["$subtotal", "$tax"]}, 2]},
            ]}},
        ]
    },
}

INDEXES = {
    "vehicles": [
        ([("registration_number", ASCENDING)], {"unique": True}),
        ([("customer_id", ASCENDING)], {}),
    ],
    "bookings": [
        ([("vehicle_id", ASCENDING), ("booking_date", DESCENDING)], {}),
        ([("status", ASCENDING)], {}),
    ],
    "job_cards": [
        ([("booking_id", ASCENDING)], {"unique": True}),
        ([("status", ASCENDING)], {}),
    ],
    # The index that makes the overlap check cheap — and the reason
    # assignments is its own collection rather than embedded in job_cards.
    "assignments": [
        ([("mechanic_id", ASCENDING), ("start_time", ASCENDING), ("end_time", ASCENDING)], {}),
        ([("job_card_id", ASCENDING)], {}),
    ],
    "part_usage": [
        ([("spare_part_id", ASCENDING), ("issued_at", DESCENDING)], {}),
        ([("job_card_id", ASCENDING)], {}),
    ],
    "spare_parts": [([("sku", ASCENDING)], {"unique": True})],
    "invoices": [
        ([("customer_id", ASCENDING)], {}),
        ([("created_at", DESCENDING)], {}),
        ([("job_card_id", ASCENDING)], {}),
    ],
    "payments": [([("invoice_id", ASCENDING)], {})],
    "inspections": [([("job_card_id", ASCENDING)], {})],
    "customers": [([("email", ASCENDING)], {"unique": True})],
}

VIEWS = {
    "pending_jobs_view": ("job_cards", [
        {"$match": {"status": {"$in": ["open", "in_progress", "awaiting_parts"]}}}
    ]),
    "revenue_by_month_view": ("invoices", [
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}},
            "revenue": {"$sum": "$total"},
        }},
        {"$sort": {"_id": 1}},
    ]),
}


async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB]
    existing = set(await db.list_collection_names())

    for name in COLLECTIONS:
        if name not in existing:
            await db.create_collection(name)
            print(f"  created collection {name}")

    for name, validator in VALIDATORS.items():
        # collMod applies to an existing collection, so this is re-runnable.
        await db.command({"collMod": name, "validator": validator, "validationLevel": "moderate"})
        print(f"  validator applied to {name}")

    for name, specs in INDEXES.items():
        for keys, opts in specs:
            idx = await db[name].create_index(keys, **opts)
            print(f"  index {name}.{idx}")

    for view, (source, pipeline) in VIEWS.items():
        if view in existing:
            await db.drop_collection(view)
        await db.create_collection(view, viewOn=source, pipeline=pipeline)
        print(f"  view {view} on {source}")

    print(f"\ndone — {MONGO_DB} ready")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
