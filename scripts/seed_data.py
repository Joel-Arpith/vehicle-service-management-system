"""Seed realistic sample data (plan Section 7).

Deterministic: a fixed random seed means the demo, the screenshots and the
report all show the same figures. Re-running wipes and re-seeds.

    python scripts/seed_data.py

Seeded assignments deliberately include a **touching pair** (one ends exactly
when the next begins) to prove the overlap rule accepts the boundary case,
and spare parts include a zero-stock item to exercise the stock rule.
"""

import asyncio
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import MONGO_DB, MONGO_URI

rng = random.Random(20260823)

NOW = datetime(2026, 8, 23, 9, 0, tzinfo=timezone.utc)

FIRST = ["Ananya", "Vikram", "Meera", "Rohan", "Farida", "Deepak", "Sharanya", "Abdul",
         "Nikhil", "Priya", "Karthik", "Sneha", "Imtiaz", "Divya", "Rakesh"]
LAST = ["Rao", "Shetty", "Iyer", "D'Souza", "Khan", "Menon", "Gowda", "Rahman",
        "Prabhu", "Nair", "Reddy", "Bhat", "Ali", "Kulkarni", "Verma"]

MAKES = [
    ("Maruti Suzuki", ["Baleno Zeta", "Swift VXi", "Brezza ZXi"]),
    ("Hyundai", ["Creta SX", "i20 Asta", "Venue S"]),
    ("Tata", ["Nexon EV", "Harrier XZ", "Altroz XT"]),
    ("Honda", ["City VX", "Amaze S", "Jazz V"]),
    ("Mahindra", ["XUV700 AX7", "Thar LX", "Scorpio N"]),
    ("Toyota", ["Innova Crysta", "Glanza G", "Urban Cruiser"]),
]

SERVICES = ["Periodic service", "Brakes & suspension", "Engine diagnostics",
            "AC service", "EV & hybrid care", "Accident repair"]

TASKS = ["Multi-point inspection", "Engine oil & filter change", "Brake pad replacement",
         "Wheel alignment & balancing", "Coolant flush", "AC gas top-up",
         "Battery health check", "Final road test", "Software update", "Clutch inspection"]

MECHANICS = [
    ("Suresh Kumar", "Engine & transmission", 7, 15),
    ("Imran Pasha", "Brakes & suspension", 7, 15),
    ("Lakshmi Devi", "Auto electrical & EV", 11, 19),
    ("Joseph Mathew", "Diagnostics", 11, 19),
    ("Ganesh Naik", "Body & paint", 7, 15),
    ("Ritu Sharma", "General service", 11, 19),
]

PARTS = [
    ("OF-1042", "Oil filter — petrol 1.2L", 34, 10, 420.0),
    ("BP-2280", "Front brake pad set", 6, 8, 2650.0),
    ("AF-3311", "Cabin air filter", 21, 12, 890.0),
    ("BT-7700", "Battery 12V 65Ah", 2, 4, 7400.0),
    ("CL-5150", "Clutch plate assembly", 0, 3, 11250.0),   # zero stock on purpose
    ("WP-9021", "Wiper blade pair", 48, 15, 640.0),
    ("SP-1180", "Spark plug set (4)", 27, 10, 1450.0),
    ("BD-4400", "Brake disc rotor", 11, 6, 3800.0),
    ("SA-6620", "Shock absorber front", 8, 4, 4250.0),
    ("TB-3030", "Timing belt kit", 5, 4, 6900.0),
    ("RD-8810", "Radiator assembly", 3, 2, 8600.0),
    ("HL-2200", "Headlamp assembly", 9, 4, 5300.0),
    ("EG-7040", "Engine oil 5W-30 (litre)", 96, 30, 610.0),
    ("CF-1500", "Coolant (litre)", 42, 15, 380.0),
    ("FF-2750", "Fuel filter", 18, 8, 1120.0),
    ("AB-9900", "Alternator belt", 24, 10, 780.0),
    ("MT-5500", "Engine mount", 7, 4, 2950.0),
    ("SS-3400", "Suspension strut rear", 6, 4, 3950.0),
    ("TY-1010", "Tyre 195/55 R16", 16, 8, 7200.0),
    ("HZ-6100", "Radiator hose", 29, 12, 540.0),
]


async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB]

    for name in ["customers", "vehicles", "bookings", "job_cards", "mechanics",
                 "assignments", "spare_parts", "part_usage", "inspections",
                 "invoices", "payments"]:
        await db[name].delete_many({})
    print("cleared existing documents")

    # ── customers ──
    customers = [
        {"_id": ObjectId(), "name": f"{FIRST[i]} {LAST[i]}",
         "phone": f"+91 9{rng.randint(1000000000, 9999999999) % 1000000000:09d}",
         "email": f"{FIRST[i].lower()}.{LAST[i].lower().replace(chr(39), '')}@example.com",
         "created_at": NOW - timedelta(days=rng.randint(200, 1400))}
        for i in range(15)
    ]
    await db.customers.insert_many(customers)

    # ── vehicles (20: five customers own two) ──
    vehicles = []
    owners = [c["_id"] for c in customers] + [customers[i]["_id"] for i in range(5)]
    for i, owner in enumerate(owners):
        make, models = MAKES[i % len(MAKES)]
        vehicles.append({
            "_id": ObjectId(), "customer_id": owner,
            "registration_number": f"KA {rng.randint(1, 60):02d} {rng.choice('ABCDEFGHJKLMNPQRS')}{rng.choice('ABCDEFGHJKLMNPQRS')} {rng.randint(1000, 9999)}",
            "make": make, "model": rng.choice(models),
            "year": rng.randint(2016, 2025), "odometer": rng.randint(5_000, 140_000),
            "created_at": NOW - timedelta(days=rng.randint(100, 1200)),
        })
    # Guarantee uniqueness even if the generator collided.
    seen = set()
    for v in vehicles:
        while v["registration_number"] in seen:
            v["registration_number"] = f"KA {rng.randint(1, 60):02d} ZZ {rng.randint(1000, 9999)}"
        seen.add(v["registration_number"])
    await db.vehicles.insert_many(vehicles)

    # ── mechanics ──
    mechanics = [
        {"_id": ObjectId(), "name": n, "specialisation": s,
         "shift_start": a, "shift_end": b, "created_at": NOW - timedelta(days=400)}
        for n, s, a, b in MECHANICS
    ]
    await db.mechanics.insert_many(mechanics)

    # ── spare parts ──
    parts = [
        {"_id": ObjectId(), "sku": sku, "name": nm, "stock_qty": qty,
         "reorder_level": lvl, "unit_price": price, "created_at": NOW - timedelta(days=300)}
        for sku, nm, qty, lvl, price in PARTS
    ]
    await db.spare_parts.insert_many(parts)

    # ── bookings (25 across ~3 months) ──
    bookings = []
    for i in range(25):
        veh = vehicles[i % len(vehicles)]
        booked = NOW - timedelta(days=rng.randint(0, 92), hours=rng.randint(0, 8))
        # Older bookings are finished; the newest handful are still live.
        done = i < 18
        bookings.append({
            "_id": ObjectId(), "vehicle_id": veh["_id"], "customer_id": veh["customer_id"],
            "service_type": rng.choice(SERVICES),
            "booking_date": booked,
            "expected_completion_date": booked + timedelta(days=rng.randint(1, 4)),
            "actual_completion_date": booked + timedelta(hours=rng.randint(6, 96)) if done else None,
            "status": "completed" if done else rng.choice(["pending", "in_progress"]),
            "created_at": booked,
        })
    await db.bookings.insert_many(bookings)

    # ── job cards (20, 1–4 embedded tasks each) ──
    job_cards = []
    for bk in bookings[:20]:
        finished = bk["status"] == "completed"
        n_tasks = rng.randint(1, 4)
        tasks = [
            {"_id": ObjectId(), "label": lbl, "estimated_hours": float(rng.choice([0.5, 1, 1.5, 2, 3])),
             "status": "completed" if finished else rng.choice(["pending", "in_progress", "awaiting_parts", "completed"])}
            for lbl in rng.sample(TASKS, n_tasks)
        ]
        job_cards.append({
            "_id": ObjectId(), "booking_id": bk["_id"], "tasks": tasks,
            "status": "completed" if finished else rng.choice(["open", "in_progress", "awaiting_parts"]),
            "created_at": bk["booking_date"],
        })
    await db.job_cards.insert_many(job_cards)

    # ── assignments (30, none overlapping) ──
    # Built per mechanic by walking a clock forward, so the seed can never
    # violate the very rule the API enforces.
    assignments = []
    cursor = {m["_id"]: NOW - timedelta(days=90) for m in mechanics}
    for i in range(30):
        jc = job_cards[i % len(job_cards)]
        task = rng.choice(jc["tasks"])
        mech = mechanics[i % len(mechanics)]
        start = cursor[mech["_id"]] + timedelta(hours=rng.randint(2, 20))
        end = start + timedelta(hours=rng.choice([1, 2, 3]))
        cursor[mech["_id"]] = end
        assignments.append({
            "_id": ObjectId(), "job_card_id": jc["_id"], "task_id": task["_id"],
            "mechanic_id": mech["_id"], "start_time": start, "end_time": end,
            "status": "completed" if end < NOW - timedelta(days=1) else "scheduled",
            "created_at": start - timedelta(hours=6),
        })

    # Touching pair: second starts exactly when the first ends. NOT an overlap —
    # proves the boundary case is accepted (plan Section 10, edge cases).
    m0 = mechanics[0]["_id"]
    touch_start = cursor[m0] + timedelta(hours=3)
    jc0 = job_cards[0]
    assignments.append({
        "_id": ObjectId(), "job_card_id": jc0["_id"], "task_id": jc0["tasks"][0]["_id"],
        "mechanic_id": m0, "start_time": touch_start, "end_time": touch_start + timedelta(hours=2),
        "status": "scheduled", "created_at": NOW,
    })
    assignments.append({
        "_id": ObjectId(), "job_card_id": jc0["_id"], "task_id": jc0["tasks"][0]["_id"],
        "mechanic_id": m0, "start_time": touch_start + timedelta(hours=2),
        "end_time": touch_start + timedelta(hours=4),
        "status": "scheduled", "created_at": NOW,
    })
    await db.assignments.insert_many(assignments)

    # ── part usage (40) — decrement stock so figures stay consistent ──
    usage = []
    for i in range(40):
        jc = job_cards[i % len(job_cards)]
        part = rng.choice([p for p in parts if p["stock_qty"] > 0])
        qty = rng.randint(1, 3)
        usage.append({
            "_id": ObjectId(), "job_card_id": jc["_id"], "spare_part_id": part["_id"],
            "qty": qty, "unit_price": part["unit_price"],
            "line_total": round(part["unit_price"] * qty, 2),
            "issued_at": jc["created_at"] + timedelta(hours=rng.randint(1, 40)),
        })
        # Mirror the real decrement; clamp at 0 so the validator can't reject.
        part["stock_qty"] = max(0, part["stock_qty"] - qty)
    await db.part_usage.insert_many(usage)
    for p in parts:
        await db.spare_parts.update_one({"_id": p["_id"]}, {"$set": {"stock_qty": p["stock_qty"]}})

    # ── inspections (20) ──
    await db.inspections.insert_many([
        {"_id": ObjectId(), "job_card_id": jc["_id"],
         "checked_items": rng.randint(28, 40), "advisories": rng.randint(0, 5),
         "notes": rng.choice(["No advisories.", "Front tyres near wear limit.",
                              "Minor coolant seepage at hose clamp.", "Wiper blades perished."]),
         "inspected_at": jc["created_at"] + timedelta(hours=1)}
        for jc in job_cards
    ])

    # ── invoices (20) — totals computed, never literal ──
    invoices = []
    for jc in job_cards:
        bk = next(b for b in bookings if b["_id"] == jc["booking_id"])
        used = [u for u in usage if u["job_card_id"] == jc["_id"]]
        line_items = [
            {"description": f"Part {u['spare_part_id']} x{u['qty']}", "amount": u["line_total"]}
            for u in used
        ] + [
            {"description": f"Labour — {t['label']}", "amount": round(t["estimated_hours"] * 850, 2)}
            for t in jc["tasks"]
        ]
        subtotal = round(sum(li["amount"] for li in line_items), 2)
        tax = round(subtotal * 0.18, 2)
        invoices.append({
            "_id": ObjectId(), "job_card_id": jc["_id"], "customer_id": bk["customer_id"],
            "line_items": line_items, "tax_rate": 0.18,
            "subtotal": subtotal, "tax": tax, "total": round(subtotal + tax, 2),
            "created_at": bk["actual_completion_date"] or (bk["booking_date"] + timedelta(days=1)),
        })
    await db.invoices.insert_many(invoices)

    # ── payments (25, incl. split payments) ──
    payments = []
    for i, inv in enumerate(invoices):
        if i % 4 == 0:  # split into two instalments
            half = round(inv["total"] / 2, 2)
            payments.append({"_id": ObjectId(), "invoice_id": inv["_id"], "amount": half,
                             "method": "upi", "paid_at": inv["created_at"] + timedelta(hours=2)})
            payments.append({"_id": ObjectId(), "invoice_id": inv["_id"],
                             "amount": round(inv["total"] - half, 2), "method": "card",
                             "paid_at": inv["created_at"] + timedelta(days=3)})
        elif i % 7 != 0:  # a few left unpaid on purpose
            payments.append({"_id": ObjectId(), "invoice_id": inv["_id"], "amount": inv["total"],
                             "method": rng.choice(["card", "upi", "netbanking", "cash"]),
                             "paid_at": inv["created_at"] + timedelta(hours=rng.randint(1, 30))})
    await db.payments.insert_many(payments)

    # Mirror what rules.record_payment() does: an invoice covered in full is
    # stamped settled. Without this the seed contradicts the API's own write
    # path and every "settled" figure reads 0 despite the payments existing.
    paid_totals: dict = {}
    for pay in payments:
        paid_totals[pay["invoice_id"]] = round(paid_totals.get(pay["invoice_id"], 0) + pay["amount"], 2)
    for inv in invoices:
        if paid_totals.get(inv["_id"], 0) >= inv["total"]:
            await db.invoices.update_one(
                {"_id": inv["_id"]},
                {"$set": {"settled_at": max(p["paid_at"] for p in payments if p["invoice_id"] == inv["_id"])}},
            )

    # ── demo accounts, one per role ──
    # Passwords are seed-only and printed below on purpose; this database is
    # sample data for a demo, never a deployment.
    from app.auth import hash_password

    await db.users.delete_many({})
    demo_password = "autocare123"
    demo_users = [
        ("manager@autocare.example", "Priya Nair", "manager", None),
        ("desk@autocare.example", "Arun Bhat", "receptionist", None),
        ("mechanic@autocare.example", "Suresh Kumar", "mechanic", None),
        (customers[0]["email"], customers[0]["name"], "customer", customers[0]["_id"]),
    ]
    await db.users.insert_many([
        {"_id": ObjectId(), "email": email, "name": name, "role": role,
         "customer_id": cid, "password_hash": hash_password(demo_password),
         "created_at": NOW}
        for email, name, role, cid in demo_users
    ])

    counts = {name: await db[name].count_documents({}) for name in [
        "customers", "vehicles", "bookings", "job_cards", "mechanics",
        "assignments", "spare_parts", "part_usage", "inspections", "invoices",
        "payments", "users"]}
    print("\nseeded:")
    for k, v in counts.items():
        print(f"  {k:<14} {v}")
    print(f"\ndemo logins (password: {demo_password})")
    for email, _, role, _ in demo_users:
        print(f"  {role:<13} {email}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
