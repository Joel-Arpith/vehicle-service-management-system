"""Ownership: a customer may read and book only their own records.

Role guards alone let any signed-in customer read another customer's job card,
inspections and vehicle (found 2026-10-05). These tests drive the real routes
over ASGI against `vsc_system_test`, with the signed-in user swapped in through
a dependency override.
"""

from datetime import datetime, timezone

import pytest_asyncio
from bson import ObjectId
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from app import db as app_db
from app.auth import current_user
from app.config import MONGO_URI
from app.main import app

A, B = ObjectId(), ObjectId()                      # two customers
VA, VB = ObjectId(), ObjectId()                    # one vehicle each
JA, JB = ObjectId(), ObjectId()                    # one job card each
REG_A, REG_B = "KA 01 TT 0001", "KA 01 TT 0002"


@pytest_asyncio.fixture
async def db():
    client = AsyncIOMotorClient(MONGO_URI)
    database = client["vsc_system_test"]
    app_db.mongo.client, app_db.mongo.db = client, database
    for name in ["vehicles", "bookings", "job_cards", "inspections"]:
        await database[name].delete_many({})
    now = datetime(2026, 9, 1, tzinfo=timezone.utc)
    for cust, veh, jc, reg in ((A, VA, JA, REG_A), (B, VB, JB, REG_B)):
        bk = ObjectId()
        await database.vehicles.insert_one({"_id": veh, "customer_id": cust, "registration_number": reg})
        await database.bookings.insert_one({"_id": bk, "vehicle_id": veh, "customer_id": cust, "status": "pending"})
        await database.job_cards.insert_one({"_id": jc, "booking_id": bk, "tasks": [], "status": "open"})
        await database.inspections.insert_one({"_id": ObjectId(), "job_card_id": jc, "checked_items": 40, "created_at": now})
    yield database
    app.dependency_overrides.clear()
    client.close()
    app_db.mongo.client = app_db.mongo.db = None


def as_user(role: str, customer_id=None) -> AsyncClient:
    app.dependency_overrides[current_user] = lambda: {"_id": ObjectId(), "role": role, "customer_id": customer_id}
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def test_customer_reads_own_job_card_and_inspections(db):
    async with as_user("customer", A) as c:
        assert (await c.get(f"/api/job_cards/{JA}")).status_code == 200
        r = await c.get(f"/api/job_cards/{JA}/inspections")
        assert r.status_code == 200 and len(r.json()) == 1


async def test_customer_cannot_read_another_customers_job_card(db):
    async with as_user("customer", A) as c:
        assert (await c.get(f"/api/job_cards/{JB}")).status_code == 404
        assert (await c.get(f"/api/job_cards/{JB}/inspections")).status_code == 404


async def test_not_yours_is_indistinguishable_from_missing(db):
    """403 would confirm the record exists; the body must not differ either."""
    async with as_user("customer", A) as c:
        theirs = await c.get(f"/api/job_cards/{JB}")
        missing = await c.get(f"/api/job_cards/{ObjectId()}")
    assert theirs.status_code == missing.status_code == 404
    assert theirs.json().keys() == missing.json().keys()
    assert theirs.json()["message"] == missing.json()["message"]


async def test_customer_vehicle_lookup_is_scoped(db):
    async with as_user("customer", A) as c:
        assert (await c.get(f"/api/vehicles/{REG_A}")).status_code == 200
        assert (await c.get(f"/api/vehicles/{REG_B}")).status_code == 404


async def test_customer_cannot_book_someone_elses_vehicle(db):
    body = {"service_type": "Periodic service", "booking_date": "2026-10-10T09:00:00Z"}
    async with as_user("customer", A) as c:
        assert (await c.post("/api/bookings", json={**body, "vehicle_id": str(VB)})).status_code == 404
        assert (await c.post("/api/bookings", json={**body, "vehicle_id": str(VA)})).status_code == 201
    assert await db.bookings.count_documents({"vehicle_id": VB}) == 1, "the refused booking must not be written"


async def test_customer_without_a_customer_record_sees_nothing(db):
    async with as_user("customer", None) as c:
        assert (await c.get(f"/api/job_cards/{JA}")).status_code == 404


async def test_staff_still_see_every_customers_records(db):
    for role in ("receptionist", "mechanic", "manager"):
        async with as_user(role) as c:
            assert (await c.get(f"/api/job_cards/{JB}")).status_code == 200
            assert (await c.get(f"/api/vehicles/{REG_B}")).status_code == 200
