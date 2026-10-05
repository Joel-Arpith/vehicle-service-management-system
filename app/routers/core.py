"""Feature endpoints (plan Section 9)."""

from bson import ObjectId
from fastapi import APIRouter, Depends, Query
from pymongo.errors import DuplicateKeyError

from app.auth import current_user, front_desk, manager_only, staff_only, workshop
from app.db import get_db
from app.errors import DuplicateError, NotFoundError
from app.models.schemas import (
    AssignmentIn, BookingIn, CustomerIn, InvoiceIn, JobCardIn, JobCardStatusIn,
    MechanicIn, PartUsageIn, PaymentIn, SparePartIn, TaskStatusIn, VehicleIn,
    doc_out, oid,
)
from app.services import rules

router = APIRouter(prefix="/api")


# ── ownership ──
# Role guards decide *which kind* of record a caller may touch; these decide
# *whose*. Staff see every customer's records; a customer sees only their own.

def _hide_unless_owner(user: dict, owner_id, what: str, **detail) -> None:
    """Answer 404 exactly as for a missing record, so a customer cannot probe
    which ids belong to someone else (403 would confirm the record exists)."""
    if user["role"] == "customer" and owner_id != user.get("customer_id"):
        raise NotFoundError(f"{what} not found", **detail)


async def _visible_job_card(db, user: dict, job_card_id: str) -> dict:
    _id = oid(job_card_id, "job card")
    jc = await rules.require(db, "job_cards", _id)
    if user["role"] == "customer":
        booking = await db.bookings.find_one({"_id": jc["booking_id"]}, {"customer_id": 1})
        _hide_unless_owner(user, booking and booking["customer_id"], "job_card", id=str(_id))
    return jc


# ── customers ──

@router.post("/customers", status_code=201, tags=["customers"], dependencies=[Depends(front_desk)])
async def create_customer(body: CustomerIn):
    db = get_db()
    doc = {**body.model_dump(), "created_at": rules.utcnow()}
    doc["_id"] = (await db.customers.insert_one(doc)).inserted_id
    return doc_out(doc)


@router.get("/customers", tags=["customers"], dependencies=[Depends(staff_only)])
async def list_customers():
    db = get_db()
    return [doc_out(d) for d in await db.customers.find().to_list(length=200)]


# ── vehicles ──

@router.post("/vehicles", status_code=201, tags=["vehicles"], dependencies=[Depends(front_desk)])
async def create_vehicle(body: VehicleIn):
    """Unique registration number is enforced by a unique index, not a lookup.

    A find-then-insert would race; catching DuplicateKeyError cannot.
    """
    db = get_db()
    customer_id = oid(body.customer_id, "customer")
    await rules.require(db, "customers", customer_id)

    doc = {**body.model_dump(), "customer_id": customer_id, "created_at": rules.utcnow()}
    try:
        doc["_id"] = (await db.vehicles.insert_one(doc)).inserted_id
    except DuplicateKeyError:
        raise DuplicateError(
            "a vehicle with this registration number already exists",
            registration_number=body.registration_number,
        )
    return doc_out(doc)


@router.get("/vehicles/{reg_no}", tags=["vehicles"])
async def get_vehicle(reg_no: str, user: dict = Depends(current_user)):
    db = get_db()
    doc = await db.vehicles.find_one({"registration_number": " ".join(reg_no.upper().split())})
    if doc is None:
        raise NotFoundError("vehicle not found", registration_number=reg_no)
    _hide_unless_owner(user, doc["customer_id"], "vehicle", registration_number=reg_no)
    return doc_out(doc)


# ── mechanics & parts ──

@router.post("/mechanics", status_code=201, tags=["mechanics"], dependencies=[Depends(manager_only)])
async def create_mechanic(body: MechanicIn):
    db = get_db()
    doc = {**body.model_dump(), "created_at": rules.utcnow()}
    doc["_id"] = (await db.mechanics.insert_one(doc)).inserted_id
    return doc_out(doc)


@router.get("/mechanics", tags=["mechanics"], dependencies=[Depends(staff_only)])
async def list_mechanics():
    db = get_db()
    return [doc_out(d) for d in await db.mechanics.find().to_list(length=200)]


@router.post("/spare_parts", status_code=201, tags=["parts"], dependencies=[Depends(manager_only)])
async def create_part(body: SparePartIn):
    db = get_db()
    doc = {**body.model_dump(), "created_at": rules.utcnow()}
    try:
        doc["_id"] = (await db.spare_parts.insert_one(doc)).inserted_id
    except DuplicateKeyError:
        raise DuplicateError("a part with this SKU already exists", sku=body.sku)
    return doc_out(doc)


@router.get("/spare_parts", tags=["parts"], dependencies=[Depends(staff_only)])
async def list_parts(low_stock: bool = False):
    db = get_db()
    docs = await db.spare_parts.find().to_list(length=500)
    if low_stock:
        docs = [d for d in docs if d["stock_qty"] <= d.get("reorder_level", 0)]
    return [doc_out(d) for d in docs]


# ── bookings ──

@router.post("/bookings", status_code=201, tags=["bookings"])
async def create_booking(body: BookingIn, user: dict = Depends(current_user)):
    db = get_db()
    vehicle_id = oid(body.vehicle_id, "vehicle")
    vehicle = await rules.require(db, "vehicles", vehicle_id)
    _hide_unless_owner(user, vehicle["customer_id"], "vehicle", id=str(vehicle_id))

    doc = {
        **body.model_dump(exclude={"vehicle_id"}),
        "vehicle_id": vehicle_id,
        "customer_id": vehicle["customer_id"],
        "actual_completion_date": None,
        "status": "pending",
        "created_at": rules.utcnow(),
    }
    doc["_id"] = (await db.bookings.insert_one(doc)).inserted_id
    return doc_out(doc)


@router.get("/bookings", tags=["bookings"], dependencies=[Depends(staff_only)])
async def list_bookings(status: str | None = Query(None)):
    db = get_db()
    query = {"status": status} if status else {}
    docs = await db.bookings.find(query).sort("booking_date", -1).to_list(length=200)
    return [doc_out(d) for d in docs]


# ── job cards ──

@router.post("/job_cards", status_code=201, tags=["job_cards"], dependencies=[Depends(front_desk)])
async def create_job_card(body: JobCardIn):
    db = get_db()
    booking_id = oid(body.booking_id, "booking")
    await rules.require(db, "bookings", booking_id)

    if await db.job_cards.find_one({"booking_id": booking_id}):
        raise DuplicateError("this booking already has a job card", booking_id=body.booking_id)

    doc = {
        "booking_id": booking_id,
        "tasks": [
            {"_id": ObjectId(), "label": t.label, "estimated_hours": t.estimated_hours, "status": "pending"}
            for t in body.tasks
        ],
        "status": "open",
        "created_at": rules.utcnow(),
    }
    doc["_id"] = (await db.job_cards.insert_one(doc)).inserted_id
    await db.bookings.update_one({"_id": booking_id}, {"$set": {"status": "in_progress"}})
    return doc_out(doc)


@router.get("/job_cards/{job_card_id}", tags=["job_cards"])
async def get_job_card(job_card_id: str, user: dict = Depends(current_user)):
    return doc_out(await _visible_job_card(get_db(), user, job_card_id))


@router.patch("/job_cards/{job_card_id}/status", tags=["job_cards"], dependencies=[Depends(staff_only)])
async def set_job_card_status(job_card_id: str, body: JobCardStatusIn):
    db = get_db()
    _id = oid(job_card_id, "job card")
    await rules.require(db, "job_cards", _id)
    await db.job_cards.update_one({"_id": _id}, {"$set": {"status": body.status}})

    # Completing a job card closes the booking and stamps the completion date
    # the turnaround report measures from.
    if body.status == "completed":
        jc = await db.job_cards.find_one({"_id": _id})
        await db.bookings.update_one(
            {"_id": jc["booking_id"]},
            {"$set": {"status": "completed", "actual_completion_date": rules.utcnow()}},
        )
    return doc_out(await db.job_cards.find_one({"_id": _id}))


@router.patch("/job_cards/{job_card_id}/tasks/{task_id}", tags=["job_cards"], dependencies=[Depends(workshop)])
async def set_task_status(job_card_id: str, task_id: str, body: TaskStatusIn):
    """Positional update of one embedded task subdocument."""
    db = get_db()
    jc_id, t_id = oid(job_card_id, "job card"), oid(task_id, "task")

    result = await db.job_cards.update_one(
        {"_id": jc_id, "tasks._id": t_id}, {"$set": {"tasks.$.status": body.status}}
    )
    if result.matched_count == 0:
        raise NotFoundError("job card or task not found", job_card_id=job_card_id, task_id=task_id)
    return doc_out(await db.job_cards.find_one({"_id": jc_id}))


@router.get("/job_cards/{job_card_id}/inspections", tags=["job_cards"])
async def list_inspections(job_card_id: str, user: dict = Depends(current_user)):
    """Inspections are seeded and indexed; without this they were write-only."""
    db = get_db()
    jc = await _visible_job_card(db, user, job_card_id)
    docs = await db.inspections.find({"job_card_id": jc["_id"]}).to_list(length=100)
    return [doc_out(d) for d in docs]


# ── assignments (Rule 1) ──

@router.post("/assignments", status_code=201, tags=["assignments"], dependencies=[Depends(front_desk)])
async def create_assignment(body: AssignmentIn):
    """409 when the mechanic is already booked in an overlapping window."""
    doc = await rules.create_assignment(
        get_db(),
        oid(body.job_card_id, "job card"),
        oid(body.task_id, "task"),
        oid(body.mechanic_id, "mechanic"),
        body.start_time,
        body.end_time,
    )
    return doc_out(doc)


# ── part usage (Rule 2) ──

@router.post("/part_usage", status_code=201, tags=["parts"], dependencies=[Depends(workshop)])
async def issue_part(body: PartUsageIn):
    """409 when the requested quantity exceeds stock on hand."""
    doc = await rules.issue_part(
        get_db(),
        oid(body.job_card_id, "job card"),
        oid(body.spare_part_id, "spare part"),
        body.qty,
    )
    return doc_out(doc)


# ── billing (Rule 3) ──

@router.post("/invoices", status_code=201, tags=["billing"], dependencies=[Depends(front_desk)])
async def create_invoice(body: InvoiceIn):
    """Totals are computed server-side; the request has no `total` field."""
    doc = await rules.create_invoice(
        get_db(),
        oid(body.job_card_id, "job card"),
        [i.model_dump() for i in body.labour_items],
        body.tax_rate,
    )
    return doc_out(doc)


@router.post("/payments", status_code=201, tags=["billing"], dependencies=[Depends(front_desk)])
async def record_payment(body: PaymentIn):
    doc = await rules.record_payment(
        get_db(), oid(body.invoice_id, "invoice"), body.amount, body.method
    )
    return doc_out(doc)
