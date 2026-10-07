"""Read endpoints behind the signed-in screens, and the payment ownership rule."""

from datetime import datetime, timezone

import pytest_asyncio
from bson import ObjectId
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from app import db as app_db
from app.auth import current_user
from app.config import MONGO_URI
from app.main import app

A, B = ObjectId(), ObjectId()
VA, VB, JA, JB, IA, IB = (ObjectId() for _ in range(6))
NOW = datetime(2026, 9, 1, tzinfo=timezone.utc)


@pytest_asyncio.fixture
async def db():
    client = AsyncIOMotorClient(MONGO_URI)
    d = client["vsc_system_test"]
    app_db.mongo.client, app_db.mongo.db = client, d
    for n in ["customers", "vehicles", "bookings", "job_cards", "invoices", "payments"]:
        await d[n].delete_many({})
    for cust, veh, jc, inv, reg, name in ((A, VA, JA, IA, "KA 01 TT 0001", "Ann"), (B, VB, JB, IB, "KA 01 TT 0002", "Bob")):
        bk = ObjectId()
        await d.customers.insert_one({"_id": cust, "name": name})
        await d.vehicles.insert_one({"_id": veh, "customer_id": cust, "registration_number": reg})
        await d.bookings.insert_one({"_id": bk, "vehicle_id": veh, "customer_id": cust, "service_type": "Periodic",
                                     "booking_date": NOW, "status": "pending"})
        await d.job_cards.insert_one({"_id": jc, "booking_id": bk, "tasks": [], "status": "open", "created_at": NOW})
        await d.invoices.insert_one({"_id": inv, "job_card_id": jc, "customer_id": cust, "line_items": [],
                                     "subtotal": 100.0, "tax": 18.0, "total": 118.0, "created_at": NOW})
    yield d
    app.dependency_overrides.clear()
    client.close()
    app_db.mongo.client = app_db.mongo.db = None


def as_user(role, customer_id=None):
    app.dependency_overrides[current_user] = lambda: {"_id": ObjectId(), "role": role, "customer_id": customer_id}
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def test_bookings_carry_registration_and_customer(db):
    async with as_user("receptionist") as c:
        rows = (await c.get("/api/bookings")).json()
    assert {r["registration_number"] for r in rows} == {"KA 01 TT 0001", "KA 01 TT 0002"}
    assert {r["customer_name"] for r in rows} == {"Ann", "Bob"}


async def test_job_card_list_is_workshop_only(db):
    async with as_user("mechanic") as c:
        r = await c.get("/api/job_cards")
        assert r.status_code == 200 and r.json()[0]["registration_number"].startswith("KA 01 TT")
    async with as_user("customer", A) as c:
        assert (await c.get("/api/job_cards")).status_code == 403


async def test_customer_sees_only_own_invoices(db):
    async with as_user("customer", A) as c:
        rows = (await c.get("/api/invoices")).json()
        assert [r["registration_number"] for r in rows] == ["KA 01 TT 0001"] and rows[0]["outstanding"] == 118.0
        assert (await c.get(f"/api/invoices/{IB}")).status_code == 404


async def test_my_vehicles_scoped_and_empty_for_staff(db):
    async with as_user("customer", A) as c:
        v = (await c.get("/api/my/vehicles")).json()
        assert [x["registration_number"] for x in v] == ["KA 01 TT 0001"] and v[0]["latest_booking"]["status"] == "pending"
    async with as_user("manager") as c:
        assert (await c.get("/api/my/vehicles")).json() == []


async def test_payment_rules_by_role(db):
    body = lambda i, amt: {"invoice_id": str(i), "amount": amt, "method": "upi"}
    async with as_user("customer", A) as c:
        assert (await c.post("/api/payments", json=body(IB, 10))).status_code == 404     # not theirs
        assert (await c.post("/api/payments", json=body(IA, 118))).status_code == 201     # theirs
        assert (await c.post("/api/payments", json=body(IA, 1))).status_code == 422       # already settled
        assert (await c.get(f"/api/invoices/{IA}")).json()["outstanding"] == 0
    async with as_user("mechanic") as c:
        assert (await c.post("/api/payments", json=body(IB, 10))).status_code == 403
