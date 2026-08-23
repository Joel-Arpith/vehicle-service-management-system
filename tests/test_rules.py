"""Business-rule tests — the edge cases plan Section 10 calls out.

Runs against a real MongoDB (database `vsc_system_test`), because
transactions and the atomic `$gte` guard are exactly what is under test and
mongomock cannot reproduce either.

    pytest -q
"""

import asyncio
from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from app import db as app_db
from app.config import MONGO_URI
from app.errors import InsufficientStockError, SchedulingConflictError
from app.services.rules import compute_totals, create_assignment, find_overlap, issue_part

T0 = datetime(2026, 9, 1, 9, 0, tzinfo=timezone.utc)


@pytest_asyncio.fixture
async def db():
    client = AsyncIOMotorClient(MONGO_URI)
    database = client["vsc_system_test"]
    # rules.create_assignment/issue_part open transactions off this global.
    app_db.mongo.client = client
    app_db.mongo.db = database

    for name in ["job_cards", "mechanics", "assignments", "spare_parts", "part_usage"]:
        await database[name].delete_many({})
    yield database
    client.close()
    app_db.mongo.client = None
    app_db.mongo.db = None


async def _fixtures(db, stock=5):
    mech_id, task_id = ObjectId(), ObjectId()
    await db.mechanics.insert_one({"_id": mech_id, "name": "Test Mechanic"})
    jc = {"_id": ObjectId(), "booking_id": ObjectId(),
          "tasks": [{"_id": task_id, "label": "Brake pads", "status": "pending"}], "status": "open"}
    await db.job_cards.insert_one(jc)
    part_id = ObjectId()
    await db.spare_parts.insert_one(
        {"_id": part_id, "sku": "TEST-1", "name": "Test part", "stock_qty": stock,
         "reorder_level": 1, "unit_price": 100.0}
    )
    return jc["_id"], task_id, mech_id, part_id


# ── Rule 1: mechanic overlap ──

@pytest.mark.asyncio
async def test_touching_windows_are_not_an_overlap(db):
    """09:00–11:00 then 11:00–13:00 is legal — the boundary must be inclusive."""
    jc_id, task_id, mech_id, _ = await _fixtures(db)

    await create_assignment(db, jc_id, task_id, mech_id, T0, T0 + timedelta(hours=2))
    await create_assignment(db, jc_id, task_id, mech_id, T0 + timedelta(hours=2), T0 + timedelta(hours=4))

    assert await db.assignments.count_documents({}) == 2


@pytest.mark.asyncio
async def test_one_minute_overlap_is_rejected(db):
    jc_id, task_id, mech_id, _ = await _fixtures(db)
    await create_assignment(db, jc_id, task_id, mech_id, T0, T0 + timedelta(hours=2))

    with pytest.raises(SchedulingConflictError):
        await create_assignment(
            db, jc_id, task_id, mech_id,
            T0 + timedelta(hours=1, minutes=59), T0 + timedelta(hours=3),
        )
    # The rejected insert must leave nothing behind.
    assert await db.assignments.count_documents({}) == 1


@pytest.mark.asyncio
async def test_cancelled_assignment_frees_the_slot(db):
    jc_id, task_id, mech_id, _ = await _fixtures(db)
    doc = await create_assignment(db, jc_id, task_id, mech_id, T0, T0 + timedelta(hours=2))
    await db.assignments.update_one({"_id": doc["_id"]}, {"$set": {"status": "cancelled"}})

    assert await find_overlap(db, mech_id, T0, T0 + timedelta(hours=2)) is None


@pytest.mark.asyncio
async def test_a_different_mechanic_may_work_the_same_window(db):
    jc_id, task_id, mech_id, _ = await _fixtures(db)
    other = ObjectId()
    await db.mechanics.insert_one({"_id": other, "name": "Second Mechanic"})

    await create_assignment(db, jc_id, task_id, mech_id, T0, T0 + timedelta(hours=2))
    await create_assignment(db, jc_id, task_id, other, T0, T0 + timedelta(hours=2))

    assert await db.assignments.count_documents({}) == 2


# ── Rule 2: stock ──

@pytest.mark.asyncio
async def test_issuing_exactly_the_remaining_stock_succeeds(db):
    jc_id, _, _, part_id = await _fixtures(db, stock=5)
    await issue_part(db, jc_id, part_id, 5)

    part = await db.spare_parts.find_one({"_id": part_id})
    assert part["stock_qty"] == 0
    assert await db.part_usage.count_documents({}) == 1


@pytest.mark.asyncio
async def test_issuing_one_more_than_stock_is_rejected(db):
    jc_id, _, _, part_id = await _fixtures(db, stock=5)

    with pytest.raises(InsufficientStockError):
        await issue_part(db, jc_id, part_id, 6)

    part = await db.spare_parts.find_one({"_id": part_id})
    assert part["stock_qty"] == 5              # untouched
    assert await db.part_usage.count_documents({}) == 0   # transaction rolled back


@pytest.mark.asyncio
async def test_concurrent_requests_cannot_both_take_the_last_unit(db):
    """The proof that the transaction and the $gte guard actually work."""
    jc_id, _, _, part_id = await _fixtures(db, stock=1)

    results = await asyncio.gather(
        issue_part(db, jc_id, part_id, 1),
        issue_part(db, jc_id, part_id, 1),
        return_exceptions=True,
    )
    ok = [r for r in results if not isinstance(r, Exception)]
    failed = [r for r in results if isinstance(r, Exception)]

    assert len(ok) == 1, "exactly one request should win the last unit"
    assert len(failed) == 1
    # Must be the domain error (→ 409), not a raw driver write-conflict (→ 500).
    # Without the transaction retry in run_transaction, this is an
    # OperationFailure and the API answers 500.
    assert isinstance(failed[0], InsufficientStockError), f"got {type(failed[0]).__name__}: {failed[0]}"
    part = await db.spare_parts.find_one({"_id": part_id})
    assert part["stock_qty"] == 0
    assert await db.part_usage.count_documents({}) == 1


# ── Rule 3: invoice totals (pure, no DB) ──

def test_totals_are_computed_from_line_items():
    got = compute_totals([{"description": "a", "amount": 9180.0},
                          {"description": "b", "amount": 3010.0}], 0.18)
    assert got == {"subtotal": 12190.0, "tax": 2194.2, "total": 14384.2}
    assert round(got["subtotal"] + got["tax"], 2) == got["total"]


def test_empty_invoice_is_zero_not_an_error():
    assert compute_totals([], 0.18) == {"subtotal": 0, "tax": 0.0, "total": 0.0}
