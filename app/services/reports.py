"""The six required reports as aggregation pipelines (plan Section 8).

These are the joins / subqueries / grouping the brief asks for: `$lookup`
replaces JOIN, `$group` replaces GROUP BY, `$unwind` flattens arrays.
"""

from datetime import datetime

from bson import ObjectId


async def pending_jobs(db) -> list[dict]:
    """Open work, with the vehicle and booking it belongs to."""
    return await db.job_cards.aggregate([
        {"$match": {"status": {"$in": ["open", "in_progress", "awaiting_parts"]}}},
        {"$lookup": {"from": "bookings", "localField": "booking_id", "foreignField": "_id", "as": "booking"}},
        {"$unwind": "$booking"},
        {"$lookup": {"from": "vehicles", "localField": "booking.vehicle_id", "foreignField": "_id", "as": "vehicle"}},
        {"$unwind": "$vehicle"},
        {"$project": {
            "_id": 0,
            "job_card_id": {"$toString": "$_id"},
            "registration_number": "$vehicle.registration_number",
            "service_type": "$booking.service_type",
            "status": 1,
            "booking_date": "$booking.booking_date",
            "open_tasks": {
                "$size": {"$filter": {
                    "input": "$tasks", "as": "t",
                    "cond": {"$ne": ["$$t.status", "completed"]},
                }}
            },
        }},
        {"$sort": {"booking_date": 1}},
    ]).to_list(length=None)


async def service_history(db, vehicle_id: ObjectId) -> list[dict]:
    """Every past visit for one vehicle, newest first."""
    return await db.bookings.aggregate([
        {"$match": {"vehicle_id": vehicle_id}},
        {"$lookup": {"from": "job_cards", "localField": "_id", "foreignField": "booking_id", "as": "job_card"}},
        {"$unwind": {"path": "$job_card", "preserveNullAndEmptyArrays": True}},
        {"$lookup": {"from": "invoices", "localField": "job_card._id", "foreignField": "job_card_id", "as": "invoice"}},
        {"$unwind": {"path": "$invoice", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "booking_id": {"$toString": "$_id"},
            "service_type": 1,
            "booking_date": 1,
            "actual_completion_date": 1,
            "status": 1,
            "job_card_status": "$job_card.status",
            "invoice_total": "$invoice.total",
        }},
        {"$sort": {"booking_date": -1}},
    ]).to_list(length=None)


async def mechanic_workload(db, month_start: datetime | None = None, month_end: datetime | None = None) -> list[dict]:
    """Hours assigned per mechanic, optionally within a window."""
    match: dict = {"status": {"$ne": "cancelled"}}
    if month_start and month_end:
        match["start_time"] = {"$gte": month_start, "$lt": month_end}

    return await db.assignments.aggregate([
        {"$match": match},
        {"$group": {
            "_id": "$mechanic_id",
            "total_hours": {"$sum": {"$divide": [{"$subtract": ["$end_time", "$start_time"]}, 3600000]}},
            "jobs_count": {"$sum": 1},
        }},
        {"$lookup": {"from": "mechanics", "localField": "_id", "foreignField": "_id", "as": "mechanic"}},
        {"$unwind": "$mechanic"},
        {"$project": {
            "_id": 0,
            "mechanic_id": {"$toString": "$_id"},
            "name": "$mechanic.name",
            "specialisation": "$mechanic.specialisation",
            "total_hours": {"$round": ["$total_hours", 1]},
            "jobs_count": 1,
        }},
        {"$sort": {"total_hours": -1}},
    ]).to_list(length=None)


async def spare_part_usage(db, limit: int = 10) -> list[dict]:
    """Most-consumed parts, with current stock alongside."""
    return await db.part_usage.aggregate([
        {"$group": {
            "_id": "$spare_part_id",
            "total_qty": {"$sum": "$qty"},
            "total_value": {"$sum": "$line_total"},
        }},
        {"$lookup": {"from": "spare_parts", "localField": "_id", "foreignField": "_id", "as": "part"}},
        {"$unwind": "$part"},
        {"$project": {
            "_id": 0,
            "sku": "$part.sku",
            "name": "$part.name",
            "total_qty": 1,
            "total_value": {"$round": ["$total_value", 2]},
            "stock_qty": "$part.stock_qty",
            "below_reorder": {"$lte": ["$part.stock_qty", "$part.reorder_level"]},
        }},
        {"$sort": {"total_qty": -1}},
        {"$limit": limit},
    ]).to_list(length=None)


async def turnaround_time(db) -> dict:
    """Average / min / max days from booking to actual completion."""
    rows = await db.bookings.aggregate([
        {"$match": {"actual_completion_date": {"$ne": None}}},
        {"$project": {
            "turnaround_days": {
                "$divide": [{"$subtract": ["$actual_completion_date", "$booking_date"]}, 86400000]
            }
        }},
        {"$group": {
            "_id": None,
            "avg_days": {"$avg": "$turnaround_days"},
            "min_days": {"$min": "$turnaround_days"},
            "max_days": {"$max": "$turnaround_days"},
            "sample": {"$sum": 1},
        }},
        {"$project": {
            "_id": 0,
            "avg_days": {"$round": ["$avg_days", 2]},
            "min_days": {"$round": ["$min_days", 2]},
            "max_days": {"$round": ["$max_days", 2]},
            "sample": 1,
        }},
    ]).to_list(length=1)
    # No completed bookings yet is a valid state, not an error.
    return rows[0] if rows else {"avg_days": None, "min_days": None, "max_days": None, "sample": 0}


async def revenue_by_month(db) -> list[dict]:
    """Invoiced revenue grouped by calendar month."""
    return await db.invoices.aggregate([
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}},
            "revenue": {"$sum": "$total"},
            "invoices": {"$sum": 1},
        }},
        {"$project": {
            "_id": 0,
            "month": "$_id",
            "revenue": {"$round": ["$revenue", 2]},
            "invoices": 1,
        }},
        {"$sort": {"month": 1}},
    ]).to_list(length=None)
