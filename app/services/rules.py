"""The three business rules with no native MongoDB equivalent.

Relational design would have used a trigger, a CHECK constraint and a
computed column. Mongo has none of those, so each rule is enforced here —
inside a transaction where more than one document changes.

See plan Section 5 for the rule → mechanism mapping.
"""

from datetime import datetime, timezone

from bson import ObjectId

from app.errors import InsufficientStockError, NotFoundError, SchedulingConflictError


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def require(db, collection: str, _id: ObjectId, session=None) -> dict:
    """Referential-integrity stand-in.

    Mongo has no FOREIGN KEY, so every reference is checked explicitly before
    a dependent document is written. Documented as a known trade-off in the
    report (plan Section 5, last row).
    """
    doc = await db[collection].find_one({"_id": _id}, session=session)
    if doc is None:
        raise NotFoundError(f"{collection[:-1]} not found", id=str(_id))
    return doc


# ─────────────────────────────────────────────────────────────
# Rule 1 — a mechanic cannot hold two overlapping assignments
# ─────────────────────────────────────────────────────────────

async def find_overlap(db, mechanic_id: ObjectId, start: datetime, end: datetime, session=None) -> dict | None:
    """Half-open interval test: [start, end).

    Touching windows do NOT overlap — an assignment ending at 11:00 and the
    next starting at 11:00 is legal. Strict `<` / `>` is what makes that true;
    `<=` / `>=` would reject the touching case.

    Served by the compound index (mechanic_id, start_time, end_time).
    """
    return await db.assignments.find_one(
        {
            "mechanic_id": mechanic_id,
            "status": {"$ne": "cancelled"},
            "start_time": {"$lt": end},
            "end_time": {"$gt": start},
        },
        session=session,
    )


async def create_assignment(db, job_card_id, task_id, mechanic_id, start, end) -> dict:
    from app.db import run_transaction

    async def work(session):
        job_card = await require(db, "job_cards", job_card_id, session)
        await require(db, "mechanics", mechanic_id, session)

        if not any(t["_id"] == task_id for t in job_card.get("tasks", [])):
            raise NotFoundError("task not found on this job card", task_id=str(task_id))

        clash = await find_overlap(db, mechanic_id, start, end, session)
        if clash is not None:
            raise SchedulingConflictError(
                "mechanic already assigned during this window",
                conflicting_assignment_id=str(clash["_id"]),
                conflicting_start=clash["start_time"].isoformat(),
                conflicting_end=clash["end_time"].isoformat(),
            )

        doc = {
            "job_card_id": job_card_id,
            "task_id": task_id,
            "mechanic_id": mechanic_id,
            "start_time": start,
            "end_time": end,
            "status": "scheduled",
            "created_at": utcnow(),
        }
        result = await db.assignments.insert_one(doc, session=session)
        doc["_id"] = result.inserted_id
        return doc

    return await run_transaction(work)


# ─────────────────────────────────────────────────────────────
# Rule 2 — a part cannot be issued beyond stock on hand
# ─────────────────────────────────────────────────────────────

async def issue_part(db, job_card_id: ObjectId, spare_part_id: ObjectId, qty: int) -> dict:
    """Atomic decrement guarded by `stock_qty >= qty`.

    The guard lives in the update *filter*, not in a read-then-write. Two
    concurrent requests for the last unit cannot both succeed: whichever
    commits second matches zero documents and is rejected. A read-check
    followed by an unconditional `$inc` would let both through.
    """
    from app.db import run_transaction

    async def work(session):
        await require(db, "job_cards", job_card_id, session)
        part = await require(db, "spare_parts", spare_part_id, session)

        result = await db.spare_parts.update_one(
            {"_id": spare_part_id, "stock_qty": {"$gte": qty}},
            {"$inc": {"stock_qty": -qty}},
            session=session,
        )
        if result.modified_count == 0:
            raise InsufficientStockError(
                "insufficient stock to issue this part",
                sku=part["sku"],
                requested=qty,
                in_stock=part["stock_qty"],
            )

        usage = {
            "job_card_id": job_card_id,
            "spare_part_id": spare_part_id,
            "qty": qty,
            "unit_price": part["unit_price"],
            "line_total": round(part["unit_price"] * qty, 2),
            "issued_at": utcnow(),
        }
        result = await db.part_usage.insert_one(usage, session=session)
        usage["_id"] = result.inserted_id
        return usage

    return await run_transaction(work)


# ─────────────────────────────────────────────────────────────
# Rule 3 — invoice totals are computed, never accepted
# ─────────────────────────────────────────────────────────────

def compute_totals(line_items: list[dict], tax_rate: float) -> dict:
    """Pure function — unit-testable without a database."""
    subtotal = round(sum(item["amount"] for item in line_items), 2)
    tax = round(subtotal * tax_rate, 2)
    return {"subtotal": subtotal, "tax": tax, "total": round(subtotal + tax, 2)}


async def create_invoice(db, job_card_id: ObjectId, labour_items: list[dict], tax_rate: float) -> dict:
    """Parts are priced from what was actually issued, not from client input."""
    from app.db import run_transaction

    async def work(session):
        job_card = await require(db, "job_cards", job_card_id, session)
        booking = await require(db, "bookings", job_card["booking_id"], session)

        parts_used = await db.part_usage.find(
            {"job_card_id": job_card_id}, session=session
        ).to_list(length=None)

        line_items = [
            {"description": f"Part {u['spare_part_id']} x{u['qty']}", "amount": u["line_total"]}
            for u in parts_used
        ] + [{"description": i["description"], "amount": round(i["amount"], 2)} for i in labour_items]

        totals = compute_totals(line_items, tax_rate)

        doc = {
            "job_card_id": job_card_id,
            "customer_id": booking["customer_id"],
            "line_items": line_items,
            "tax_rate": tax_rate,
            **totals,
            "created_at": utcnow(),
        }
        result = await db.invoices.insert_one(doc, session=session)
        doc["_id"] = result.inserted_id
        return doc

    return await run_transaction(work)


async def record_payment(db, invoice_id: ObjectId, amount: float, method: str) -> dict:
    """Partial payments allowed; the invoice closes only once fully settled."""
    from app.db import run_transaction

    async def work(session):
        invoice = await require(db, "invoices", invoice_id, session)

        paid = await db.payments.aggregate(
            [{"$match": {"invoice_id": invoice_id}}, {"$group": {"_id": None, "sum": {"$sum": "$amount"}}}],
            session=session,
        ).to_list(length=1)
        already = paid[0]["sum"] if paid else 0.0
        outstanding = round(invoice["total"] - already, 2)

        if amount > outstanding + 0.01:
            from app.errors import InvalidStateError

            raise InvalidStateError(
                "payment exceeds outstanding balance",
                outstanding=outstanding,
                attempted=amount,
            )

        doc = {
            "invoice_id": invoice_id,
            "amount": round(amount, 2),
            "method": method,
            "paid_at": utcnow(),
        }
        result = await db.payments.insert_one(doc, session=session)
        doc["_id"] = result.inserted_id

        if round(already + amount, 2) >= invoice["total"]:
            await db.invoices.update_one(
                {"_id": invoice_id}, {"$set": {"settled_at": utcnow()}}, session=session
            )
        return doc

    return await run_transaction(work)
