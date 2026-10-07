"""Read endpoints the signed-in screens need (bookings diary, job-card board,
invoices, a customer's own vehicles). Ownership follows core.py: staff see
everything, a customer sees only their own records."""

from fastapi import APIRouter, Depends

from app.auth import current_user, staff_only, workshop
from app.db import get_db
from app.errors import NotFoundError
from app.models.schemas import doc_out, oid
from app.services import rules

router = APIRouter(prefix="/api", tags=["views"])


async def _paid(db, invoice_ids: list) -> dict:
    rows = await db.payments.aggregate(
        [{"$match": {"invoice_id": {"$in": invoice_ids}}}, {"$group": {"_id": "$invoice_id", "sum": {"$sum": "$amount"}}}]
    ).to_list(length=None)
    return {r["_id"]: round(r["sum"], 2) for r in rows}


async def _invoice_out(db, invs: list) -> list:
    """Attach registration number and payment position to invoices."""
    if not invs:
        return []
    paid = await _paid(db, [i["_id"] for i in invs])
    jcs = {j["_id"]: j for j in await db.job_cards.find({"_id": {"$in": [i["job_card_id"] for i in invs]}}).to_list(None)}
    bks = {b["_id"]: b for b in await db.bookings.find({"_id": {"$in": [j["booking_id"] for j in jcs.values()]}}).to_list(None)}
    vehs = {v["_id"]: v for v in await db.vehicles.find({"_id": {"$in": [b["vehicle_id"] for b in bks.values()]}}).to_list(None)}
    out = []
    for i in invs:
        veh = vehs.get(bks.get(jcs.get(i["job_card_id"], {}).get("booking_id"), {}).get("vehicle_id"), {})
        p = paid.get(i["_id"], 0.0)
        out.append({**doc_out(i), "registration_number": veh.get("registration_number"),
                    "paid": p, "outstanding": round(max(i["total"] - p, 0), 2)})
    return out


@router.get("/invoices")
async def list_invoices(user: dict = Depends(current_user)):
    db = get_db()
    q = {"customer_id": user.get("customer_id")} if user["role"] == "customer" else {}
    invs = await db.invoices.find(q).sort("created_at", -1).to_list(length=100)
    return await _invoice_out(db, invs)


@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, user: dict = Depends(current_user)):
    db = get_db()
    inv = await rules.require(db, "invoices", oid(invoice_id, "invoice"))
    if user["role"] == "customer" and inv["customer_id"] != user.get("customer_id"):
        raise NotFoundError("invoice not found", id=invoice_id)   # same as missing
    return (await _invoice_out(db, [inv]))[0]


@router.get("/job_cards", dependencies=[Depends(workshop)])
async def list_job_cards():
    """Open cards first, newest first; each carries its registration number."""
    db = get_db()
    jcs = await db.job_cards.find().sort("created_at", -1).to_list(length=200)
    jcs.sort(key=lambda j: j["status"] in ("completed", "cancelled"))
    jcs = jcs[:30]
    bks = {b["_id"]: b for b in await db.bookings.find({"_id": {"$in": [j["booking_id"] for j in jcs]}}).to_list(None)}
    vehs = {v["_id"]: v for v in await db.vehicles.find({"_id": {"$in": [b["vehicle_id"] for b in bks.values()]}}).to_list(None)}
    return [
        {**doc_out(j), "registration_number": vehs[bks[j["booking_id"]]["vehicle_id"]]["registration_number"],
         "service_type": bks[j["booking_id"]]["service_type"]}
        for j in jcs
    ]


@router.get("/my/vehicles")
async def my_vehicles(user: dict = Depends(current_user)):
    """A customer's vehicles, each with its latest booking. Staff get none."""
    db = get_db()
    cid = user.get("customer_id")
    if user["role"] != "customer" or cid is None:
        return []
    out = []
    for v in await db.vehicles.find({"customer_id": cid}).to_list(length=50):
        last = await db.bookings.find_one({"vehicle_id": v["_id"]}, sort=[("booking_date", -1)])
        out.append({**doc_out(v), "latest_booking": last and {
            "service_type": last["service_type"], "status": last["status"], "booking_date": last["booking_date"]}})
    return out
