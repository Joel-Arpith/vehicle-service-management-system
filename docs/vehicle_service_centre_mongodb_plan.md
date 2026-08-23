# Vehicle Service Centre Management System
## Full-Stack Project Plan — Python + MongoDB

> **Note on scope deviation:** Your assignment brief specifies a relational DBMS (MySQL/PostgreSQL/Oracle) normalized to 3NF with foreign keys and CHECK constraints. This plan uses MongoDB instead. Every relational requirement in the brief has been mapped to its closest MongoDB/NoSQL equivalent below. **Include a short "Design Justification" note in your Review 1 submission** explaining this choice and the mapping — this is the single most important thing to get right politically with your evaluator, since it shows you understood the original requirements rather than ignored them.

---

## 1. Problem Identification, Scope & Objectives

**Problem:** Service centres currently track bookings, job cards, mechanic assignments, parts usage, and billing on paper or in disconnected spreadsheets, making service history, mechanic workload, and turnaround time hard to track or report on.

**Objectives:**
- Digitize the full workflow: customer & vehicle registration → booking → job card → task assignment → parts issue → inspection → invoice → payment.
- Provide accurate, queryable service history per vehicle/customer.
- Enforce business rules programmatically since MongoDB has no native FK/CHECK constraints.
- Provide operational reports (pending jobs, mechanic workload, part usage, turnaround time, revenue).

**Users / Roles:**
| Role | Key Actions |
|---|---|
| Front-desk staff | Register customers/vehicles, create bookings, generate invoices |
| Service manager | Create job cards, assign mechanics, view workload/turnaround reports |
| Mechanic | Update task/job status, log part usage |
| Storekeeper | Manage spare-part stock, approve part issue |
| Admin | User management, view revenue reports |

**Functional Requirements (summary):**
1. CRUD on customers, vehicles, spare parts, mechanics.
2. Create/manage service bookings and job cards.
3. Assign mechanics to job cards without double-booking (time overlap check).
4. Issue spare parts against a job card, decrementing stock atomically; block if insufficient stock.
5. Record inspections and task-level status.
6. Generate invoices with computed totals (labor + parts + tax) and record payments.
7. Reports: pending jobs, service history, mechanic workload, spare-part usage, turnaround time, revenue.
8. Input validation, search, and error handling in the app layer.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Database | MongoDB (local Community Server or Atlas free tier) | Required by your revised scope |
| Backend/API | Python 3.11+, **FastAPI** | Async, built-in validation via Pydantic, auto Swagger docs (great for the viva demo) |
| Driver | **Motor** (async PyMongo) or PyMongo (sync) — recommend Motor for FastAPI | Native async support matches FastAPI |
| Frontend | **Jinja2 templates + Bootstrap 5** (server-rendered) — simplest for a solo student project | Fast to build, no separate build tooling; optional upgrade path to React SPA if time allows |
| Auth | FastAPI's OAuth2PasswordBearer + JWT, roles stored on user doc | Simple role-based access for the 5 user types |
| Testing | `pytest` + `mongomock` (or a disposable test DB) | Unit + integration testing without touching prod data |
| Reporting/Charts | Chart.js (frontend) fed by aggregation pipeline JSON from API | Visual reports for turnaround/revenue |

Suggested repo structure:
```
vsc-system/
├── app/
│   ├── main.py                 # FastAPI app entrypoint
│   ├── db.py                   # Motor client + DB handle
│   ├── config.py                # env vars, settings
│   ├── models/                  # Pydantic schemas (request/response)
│   │   ├── customer.py
│   │   ├── vehicle.py
│   │   ├── booking.py
│   │   ├── job_card.py
│   │   ├── mechanic.py
│   │   ├── spare_part.py
│   │   ├── invoice.py
│   │   └── ...
│   ├── routers/                 # API route groups (one per collection/workflow)
│   │   ├── customers.py
│   │   ├── vehicles.py
│   │   ├── bookings.py
│   │   ├── job_cards.py
│   │   ├── assignments.py
│   │   ├── parts.py
│   │   ├── invoices.py
│   │   └── reports.py
│   ├── services/                 # Business logic (overlap checks, stock checks, invoice totals)
│   │   ├── scheduling.py
│   │   ├── inventory.py
│   │   └── billing.py
│   ├── templates/                # Jinja2 HTML
│   └── static/                   # CSS/JS
├── scripts/
│   ├── init_indexes.py           # Creates all indexes + $jsonSchema validators
│   └── seed_data.py              # Loads realistic sample data
├── tests/
│   ├── test_scheduling.py
│   ├── test_inventory.py
│   ├── test_billing.py
│   └── test_api.py
├── requirements.txt
└── README.md
```

---

## 3. Conceptual Design — Collections & Relationships

MongoDB has no joins/FKs by default, so every relationship from the original ER model must be deliberately modeled as **embedding** (denormalize, store together) or **referencing** (normalize, store an ObjectId and query separately). Decision principle: **embed when data is read together and doesn't grow unbounded or get updated independently; reference when data is large, shared, updated independently, or many-to-many.**

| Entity (from original ER) | MongoDB Collection | Embed or Reference? | Rationale |
|---|---|---|---|
| Customer | `customers` | — | Root entity |
| Vehicle | `vehicles` | Reference `customer_id` | A vehicle belongs to one customer, but is queried independently (by reg. number) often |
| Service Booking | `bookings` | Reference `vehicle_id`, `customer_id` | Bookings queried by date range independent of vehicle doc |
| Job Card | `job_cards` | Reference `booking_id`; **embed `tasks[]`** | Tasks are always read/written with their job card, bounded in number |
| Task | embedded array inside `job_cards.tasks[]` | Embedded | Small, bounded, always accessed with parent |
| Mechanic | `mechanics` | — | Root entity, referenced by assignments |
| Assignment | `assignments` (own collection, NOT embedded in job_cards) | Reference `job_card_id`, `mechanic_id`, `task_id` | Needs its own collection so we can index `(mechanic_id, start_time, end_time)` for the overlap-check business rule — embedding would make that query impossible to index cleanly |
| Spare Part | `spare_parts` | — | Root entity holding current stock |
| Part Usage | `part_usage` (own collection) | Reference `job_card_id`, `spare_part_id` | Needs independent querying for "spare-part use" reports; also participates in a transaction with `spare_parts.stock` |
| Inspection | embedded array inside `job_cards.inspections[]` OR own `inspections` collection if inspections can happen outside a job card (recommend own collection referencing `job_card_id` and `vehicle_id`) | Reference | Keeps job card doc size bounded; inspections may need independent audit trail |
| Invoice | `invoices` | Reference `job_card_id`, `customer_id`; **embed line items[]** | Line items (labor + parts) are always read with the invoice, immutable once issued |
| Payment | `payments` | Reference `invoice_id` | Multiple partial payments possible against one invoice — many-to-one, better as own collection |

**Final collection list (11):** `customers`, `vehicles`, `bookings`, `job_cards` (embeds `tasks`), `mechanics`, `assignments`, `spare_parts`, `part_usage`, `inspections`, `invoices` (embeds `line_items`), `payments`.

### Relationship diagram (textual)
```
customers ──1:N── vehicles ──1:N── bookings ──1:1── job_cards ──1:N(embedded)── tasks
                                                        │
                                                        ├──1:N── assignments ──N:1── mechanics
                                                        ├──1:N── part_usage ──N:1── spare_parts
                                                        ├──1:N── inspections
                                                        └──1:1── invoices ──1:N(embedded)── line_items
                                                                     │
                                                                     └──1:N── payments
```

---

## 4. Schema Design (MongoDB `$jsonSchema` validators)

This is your equivalent of DDL. Below are representative schemas — expand similarly for the rest. Store these in `scripts/init_indexes.py` and apply via `db.create_collection(..., validator=...)` or `collMod`.

### 4.1 `vehicles`
```python
vehicle_schema = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["registration_number", "customer_id", "make", "model", "created_at"],
        "properties": {
            "registration_number": {"bsonType": "string", "description": "must be unique, enforced via index"},
            "customer_id": {"bsonType": "objectId"},
            "make": {"bsonType": "string"},
            "model": {"bsonType": "string"},
            "year": {"bsonType": "int", "minimum": 1980, "maximum": 2100},
            "vin": {"bsonType": "string"},
            "created_at": {"bsonType": "date"}
        }
    }
}
```
Enforce **uniqueness** (the "unique vehicle registration" business rule) with:
```python
db.vehicles.create_index("registration_number", unique=True)
```

### 4.2 `assignments` (the overlap-prevention collection)
```python
assignment_schema = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["mechanic_id", "job_card_id", "task_id", "start_time", "end_time", "status"],
        "properties": {
            "mechanic_id": {"bsonType": "objectId"},
            "job_card_id": {"bsonType": "objectId"},
            "task_id": {"bsonType": "objectId"},
            "start_time": {"bsonType": "date"},
            "end_time": {"bsonType": "date"},
            "status": {"enum": ["scheduled", "in_progress", "completed", "cancelled"]}
        }
    }
}
```
Compound index to make overlap checks fast:
```python
db.assignments.create_index([("mechanic_id", 1), ("start_time", 1), ("end_time", 1)])
```
**Business rule enforcement (no native constraint exists for this in Mongo):** before inserting an assignment, run an aggregation/query inside the same transaction:
```python
async def has_overlap(db, mechanic_id, start, end, session):
    conflict = await db.assignments.find_one({
        "mechanic_id": mechanic_id,
        "status": {"$ne": "cancelled"},
        "start_time": {"$lt": end},
        "end_time": {"$gt": start}
    }, session=session)
    return conflict is not None
```

### 4.3 `spare_parts` and `part_usage` (stock-limit rule)
```python
spare_part_schema = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["name", "sku", "stock_qty", "unit_price"],
        "properties": {
            "name": {"bsonType": "string"},
            "sku": {"bsonType": "string"},
            "stock_qty": {"bsonType": "int", "minimum": 0},
            "unit_price": {"bsonType": "double", "minimum": 0}
        }
    }
}
```
`db.spare_parts.create_index("sku", unique=True)`

**"Part usage within stock" rule — enforced via an ACID multi-document transaction:**
```python
async def issue_part(db, job_card_id, part_id, qty, session):
    result = await db.spare_parts.update_one(
        {"_id": part_id, "stock_qty": {"$gte": qty}},
        {"$inc": {"stock_qty": -qty}},
        session=session
    )
    if result.modified_count == 0:
        raise InsufficientStockError(part_id)
    await db.part_usage.insert_one({
        "job_card_id": job_card_id, "spare_part_id": part_id,
        "qty": qty, "issued_at": datetime.utcnow()
    }, session=session)
```
This atomic `$gte` guard is your equivalent of a relational CHECK constraint — it prevents stock going negative even under concurrent requests.

### 4.4 `bookings` (valid date rule)
Use a validator with `$expr` to reject bad dates at the DB layer as a safety net (primary validation still happens in Pydantic/FastAPI):
```python
booking_schema = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["vehicle_id", "customer_id", "booking_date", "status"],
        "properties": {
            "vehicle_id": {"bsonType": "objectId"},
            "customer_id": {"bsonType": "objectId"},
            "booking_date": {"bsonType": "date"},
            "expected_completion_date": {"bsonType": "date"},
            "actual_completion_date": {"bsonType": ["date", "null"]},
            "status": {"enum": ["pending", "in_progress", "completed", "cancelled"]}
        }
    }
}
```
```python
db.command({
    "collMod": "bookings",
    "validator": {"$and": [
        booking_schema["$jsonSchema"],
        {"$expr": {"$or": [
            {"$eq": ["$expected_completion_date", None]},
            {"$gte": ["$expected_completion_date", "$booking_date"]}
        ]}}
    ]}
})
```

### 4.5 `invoices` (accurate totals rule)
```python
invoice_schema = {
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
                        "amount": {"bsonType": "double", "minimum": 0}
                    }
                }
            },
            "subtotal": {"bsonType": "double"},
            "tax": {"bsonType": "double"},
            "total": {"bsonType": "double"}
        }
    }
}
```
**Accurate totals rule:** never trust a client-supplied total. Always recompute `subtotal = sum(line_items.amount)`, `total = subtotal + tax` **server-side** in `services/billing.py` at invoice-creation time, and add a `$expr` validator as a second line of defense:
```python
{"$expr": {"$eq": ["$total", {"$add": ["$subtotal", "$tax"]}]}}
```

---

## 5. Business Rule → Enforcement Mechanism Map

| Original rule | Relational mechanism | MongoDB mechanism |
|---|---|---|
| Unique vehicle registration | `UNIQUE` constraint | Unique index on `vehicles.registration_number` |
| No overlapping mechanic work | Trigger/app check + FK | Compound index + app-level overlap query, run inside a transaction |
| Part usage within stock | `CHECK (stock_qty >= 0)` | Atomic `$inc` with `$gte` filter guard inside a transaction |
| Valid booking/completion dates | `CHECK (completion_date >= booking_date)` | `$expr` validator + Pydantic validation |
| Accurate invoice totals | Computed column / trigger | Server-side computation + `$expr` validator as safety net |
| Referential integrity (FK) | `FOREIGN KEY` | No native equivalent — enforced entirely in the service layer (e.g., check `customer_id` exists before inserting a `vehicle`); document this explicitly as a known trade-off in your report |

---

## 6. Indexing Plan

| Collection | Index | Purpose |
|---|---|---|
| `vehicles` | `{registration_number: 1}` unique | Uniqueness + fast lookup |
| `vehicles` | `{customer_id: 1}` | Service history by customer |
| `bookings` | `{vehicle_id: 1, booking_date: -1}` | Service history by vehicle |
| `bookings` | `{status: 1}` | Pending jobs report |
| `job_cards` | `{booking_id: 1}` | 1:1 lookup |
| `job_cards` | `{status: 1}` | Pending jobs report |
| `assignments` | `{mechanic_id: 1, start_time: 1, end_time: 1}` | Overlap check + workload report |
| `part_usage` | `{spare_part_id: 1, issued_at: -1}` | Spare-part use report |
| `part_usage` | `{job_card_id: 1}` | Job cost rollup |
| `invoices` | `{customer_id: 1}`, `{created_at: -1}` | Revenue reports |
| `spare_parts` | `{sku: 1}` unique | Uniqueness |

---

## 7. Sample Data

Seed each collection with ~15–20 realistic documents in `scripts/seed_data.py`:
- 15 customers, 20 vehicles (some customers with 2 vehicles)
- 25 bookings spread across the last 3 months, mixed statuses
- 20 job cards, each with 1–4 embedded tasks
- 6 mechanics with varied skill tags
- 30 assignments (deliberately include a near-miss case that is *not* an overlap, to test your boundary logic)
- 20 spare parts with varied stock levels (include at least one low-stock item to test the stock-limit rule)
- 40 part_usage records
- 20 inspections
- 20 invoices with realistic line items
- 25 payments (include a couple of split/partial payments against one invoice)

---

## 8. Reporting Queries (Aggregation Pipelines)

These are your "joins / subqueries / aggregation / views" equivalent.

**Pending jobs:**
```python
db.job_cards.aggregate([
    {"$match": {"status": {"$in": ["open", "in_progress"]}}},
    {"$lookup": {"from": "bookings", "localField": "booking_id", "foreignField": "_id", "as": "booking"}},
    {"$unwind": "$booking"},
    {"$lookup": {"from": "vehicles", "localField": "booking.vehicle_id", "foreignField": "_id", "as": "vehicle"}},
    {"$unwind": "$vehicle"},
    {"$project": {"vehicle.registration_number": 1, "status": 1, "booking.booking_date": 1}}
])
```

**Service history per vehicle:**
```python
db.bookings.aggregate([
    {"$match": {"vehicle_id": vehicle_id}},
    {"$lookup": {"from": "job_cards", "localField": "_id", "foreignField": "booking_id", "as": "job_card"}},
    {"$unwind": "$job_card"},
    {"$lookup": {"from": "invoices", "localField": "job_card._id", "foreignField": "job_card_id", "as": "invoice"}},
    {"$sort": {"booking_date": -1}}
])
```

**Mechanic workload (hours assigned this month):**
```python
db.assignments.aggregate([
    {"$match": {"start_time": {"$gte": month_start, "$lt": month_end}}},
    {"$group": {
        "_id": "$mechanic_id",
        "total_hours": {"$sum": {"$divide": [{"$subtract": ["$end_time", "$start_time"]}, 3600000]}},
        "jobs_count": {"$sum": 1}
    }},
    {"$lookup": {"from": "mechanics", "localField": "_id", "foreignField": "_id", "as": "mechanic"}},
    {"$unwind": "$mechanic"},
    {"$sort": {"total_hours": -1}}
])
```

**Spare-part usage (top consumed parts):**
```python
db.part_usage.aggregate([
    {"$group": {"_id": "$spare_part_id", "total_qty": {"$sum": "$qty"}}},
    {"$lookup": {"from": "spare_parts", "localField": "_id", "foreignField": "_id", "as": "part"}},
    {"$unwind": "$part"},
    {"$sort": {"total_qty": -1}},
    {"$limit": 10}
])
```

**Turnaround time (avg days from booking to completion):**
```python
db.bookings.aggregate([
    {"$match": {"actual_completion_date": {"$ne": None}}},
    {"$project": {
        "turnaround_days": {"$divide": [
            {"$subtract": ["$actual_completion_date", "$booking_date"]}, 86400000
        ]}
    }},
    {"$group": {"_id": None, "avg_turnaround": {"$avg": "$turnaround_days"}}}
])
```

**Revenue (monthly):**
```python
db.invoices.aggregate([
    {"$group": {
        "_id": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}},
        "revenue": {"$sum": "$total"}
    }},
    {"$sort": {"_id": 1}}
])
```

**Views** (MongoDB equivalent of SQL views — created once, queried like a read-only collection):
```python
db.create_collection("pending_jobs_view", viewOn="job_cards", pipeline=[
    {"$match": {"status": {"$in": ["open", "in_progress"]}}}
])
```
Create similar views for `mechanic_workload_view`, `revenue_by_month_view`.

---

## 9. Full-Stack Application — Feature-to-Endpoint Map

| Feature (from brief) | Route(s) | Notes |
|---|---|---|
| Vehicle registration | `POST /vehicles`, `GET /vehicles/{reg_no}` | Validates uniqueness, links to customer |
| Service booking | `POST /bookings`, `GET /bookings?status=` | Date validation |
| Job-card processing | `POST /job_cards`, `PATCH /job_cards/{id}/status` | Manages embedded tasks array |
| Mechanic assignment | `POST /assignments` | Runs overlap check inside a transaction, returns 409 on conflict |
| Part issue | `POST /part_usage` | Runs stock-check transaction, returns 409 on insufficient stock |
| Status update | `PATCH /job_cards/{id}/tasks/{task_id}` | Updates embedded subdocument |
| Billing | `POST /invoices`, `POST /payments` | Server computes totals, never trusts client input |
| Service-history reporting | `GET /reports/service-history/{vehicle_id}` | Uses aggregation pipeline above |
| Other reports | `GET /reports/pending-jobs`, `/mechanic-workload`, `/spare-part-usage`, `/turnaround-time`, `/revenue` | All backed by aggregation pipelines/views |

**Validation:** Pydantic models on every request body (type, required fields, enums, regex for registration numbers/phone numbers).

**Error handling:** custom exception classes (`InsufficientStockError`, `SchedulingConflictError`, `NotFoundError`) mapped to FastAPI exception handlers returning proper HTTP status codes (404/409/422) with clear messages — this is what your evaluator will specifically probe in the Review 3 demo.

**Transactions:** MongoDB transactions require a replica set (even a single-node one works locally: `mongod --replSet rs0` then `rs.initiate()`). Document this setup step clearly in your README since it trips up most students trying this for the first time.

---

## 10. Testing Strategy

- **Unit tests** (`pytest`): overlap-detection logic, stock-check logic, invoice total computation — test pure functions in `services/` independent of the DB where possible.
- **Integration tests**: spin up a test database (or use `mongomock`/`mongomock-motor`), seed minimal fixtures, hit the actual FastAPI routes via `TestClient`, assert on status codes and DB state after the call.
- **Edge cases to explicitly test** (these make a strong viva impression):
  - Two assignments for the same mechanic with exactly touching times (no overlap) vs. overlapping by one minute (should reject).
  - Issuing a part quantity equal to remaining stock (should succeed, leaves 0) vs. one more than stock (should reject).
  - Booking with `expected_completion_date` before `booking_date` (should reject).
  - Concurrent part-issue requests racing for the last unit of stock (should not both succeed — this proves your transaction actually works).

---

## 11. Weekly Timeline (aligned to your 3 reviews)

| Weeks | Milestone |
|---|---|
| 1–2 | Requirements gathering, finalize user roles, draft functional requirements doc |
| 3–4 | Conceptual design: entity list, embedding/referencing decisions, relationship diagram |
| 5–6 | Draft initial collection schemas + Review 1 write-up |
| **7** | **Review 1 submission** |
| 8 | Implement `$jsonSchema` validators, indexes, and `init_indexes.py` |
| 9 | Implement business-rule services (overlap, stock, totals) + unit tests |
| 10 | Seed data script, write all aggregation pipelines/views |
| 11 | **Review 2 submission** (schema, DDL-equivalent scripts, sample data, queries, prototype demo) |
| 12–13 | Build FastAPI routers + Pydantic models for all 8 features |
| 14 | Build frontend templates (forms, tables, report dashboards with Chart.js) |
| 15 | Integration testing, error handling polish, edge-case tests |
| **16** | **Review 3**: final demo, source code, test data, screenshots, report, viva prep |

---

## 12. Report Sections Checklist (for your written submission)

1. Problem statement, scope, objectives, users, functional requirements
2. **Design justification** (why MongoDB, mapping table from Section 5 above)
3. Conceptual design + embedding/referencing rationale (Section 3)
4. Schema definitions with validators (Section 4)
5. Business rule enforcement mechanisms (Section 5)
6. Indexing strategy (Section 6)
7. Sample data description
8. Reporting queries with sample output/screenshots
9. Application architecture, screenshots of each feature
10. Test plan and results, including edge cases
11. Known limitations (no native referential integrity, transaction dependency on replica set) and how you mitigated them
12. Conclusion, future work

---

## 13. Setup Quickstart

```bash
# 1. MongoDB as a single-node replica set (needed for transactions)
mongod --dbpath ./data --replSet rs0 --port 27017
# in a mongo shell:
rs.initiate()

# 2. Python environment
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn motor pydantic python-jose passlib pytest mongomock

# 3. Seed & index
python scripts/init_indexes.py
python scripts/seed_data.py

# 4. Run
uvicorn app.main:app --reload
# Swagger docs at http://localhost:8000/docs — great for live demo during viva
```
