# Slide prompt — PBL Review 2 (AutoCare, MongoDB)

Paste the fenced block into an AI slide tool (Gamma, Claude, ChatGPT, Copilot in
PowerPoint). Self-contained — the tool cannot see your repo, so every figure is
stated inline and it is told not to invent any. **10 slides, hard cap.**

**Every number was measured on 2026-10-03** by running the code, not recalled:
`pytest`, the OpenAPI schema, `init_indexes.py`, the live database, the DBML parser,
and a fresh run of the demo against the running API.

> ## Read before you present
>
> **I do not have your PBL Review 2 brief.** I took the deliverables from your own
> project plan, Section 11, week 11: *"schema, DDL-equivalent scripts, sample data,
> queries, prototype demo."* All five exist. If your brief differs, tell me.
>
> **About "the simplified ER diagram."** In *this* project the ER diagram was **not**
> cut down the way the crop-farm one was (18 → 14 → 8 tables — a different project,
> deliberately not mixed in here). The only simplification AutoCare has is the
> two-level pair: a **13-entity conceptual diagram** that is the simplified view of
> the **14-table physical diagram**. Slide 3 presents exactly that and nothing more.
> **If you meant something else, say so before you present it** — don't let the slide
> claim a simplification that didn't happen.
>
> **Two things your evaluator can still catch you on:**
> 1. `docs/vehicle_service_centre_mongodb_plan.md` Sections 2 and 11 **still say
>    Jinja2/Bootstrap, frontend at week 14.** The app is React. The instructor was
>    never told. If the plan is part of what you submit, update it first.
> 2. Only the **dashboard** reads the live API. Bookings, Jobs, Invoice and My-garage
>    still run on fixture data. Slide 9 says so; do not demo those four as if they
>    were wired.

---

```
You are helping me build a slide deck for Review 2 of my Project-Based Learning
(PBL) Database Management Systems project. Audience: my course evaluator plus two
faculty, all database specialists. They saw Review 1, so do NOT re-explain the
problem statement; build on it. Review 2 is about IMPLEMENTATION: schema,
DDL-equivalent scripts, sample data, queries, and a prototype demo.

Produce EXACTLY 10 slides — no more. For each slide give a title, an ALL-CAPS
eyebrow label, 3-5 terse bullets, and a speaker-note paragraph I can say aloud.
No "In this presentation we will..." slide. Do not invent any figure: every number
is given below and must match exactly. Never fabricate screenshots, query output
or row counts; where I say a screenshot goes, draw a dashed placeholder box
labelled "SCREENSHOT" so I can drop the real one in.

=== DESIGN DIRECTION ===
Editorial and restrained, not corporate-template. Each slide: a small ALL-CAPS
eyebrow above a large plain-English headline. Generous white space. Code, JSON and
data in monospace. Numbers big and unadorned. No stock photography, no clip-art
icons, no gradients, no drop shadows. One warm accent colour used sparingly;
everything else near-black on off-white. Tables are ruled lines only, no fills.

=== PROJECT ===
AutoCare — a Vehicle Service Centre Management System. A multi-brand service
centre books vehicles in, opens a job card, assigns mechanics to individual tasks,
issues spare parts from stock, and bills the customer. Built on MongoDB.

THE CENTRAL TENSION, which every slide should serve: the original brief specified
a relational DBMS (3NF, foreign keys, CHECK constraints, triggers). I proposed
MongoDB and my instructor approved it. MongoDB has none of those mechanisms. The
project's claim is that every relational guarantee was rebuilt explicitly and
tested, and the one thing that was not recovered is stated openly.

=== SLIDE 1 — WHERE WE ARE ===
Eyebrow: REVIEW 2 · IMPLEMENTATION
Headline: "Review 1 was the design. This is the build."
A two-column status strip. All five Review 2 items are complete:
  Schema ...................... 12 collections, 5 validators, 18 indexes, 2 views
  DDL-equivalent scripts ...... init_indexes.py, idempotent
  Sample data ................. 245 documents across 12 collections
  Queries ..................... 6 required aggregation pipelines + 2 views
  Prototype ................... React frontend + FastAPI backend, 33 endpoints
Footer stat strip, exactly: 33 endpoints · 21 tests passing · 12 collections ·
245 documents

=== SLIDE 2 — THE SCHEMA ===
Eyebrow: SCHEMA · THE DDL EQUIVALENT
Headline: "Twelve collections, rebuilt guarantees"
Big numbers: 12 collections · 5 validators · 18 indexes (5 unique) · 2 views.
Collections: customers, vehicles, bookings, job_cards, mechanics, assignments,
spare_parts, part_usage, inspections, invoices, payments, users.
$jsonSchema validators on: vehicles, assignments, spare_parts, bookings, invoices.
Views: pending_jobs_view (job_cards where status is open, in_progress or
awaiting_parts) and revenue_by_month_view (invoices grouped by month).
Make this point: init_indexes.py is the DDL equivalent. It is idempotent — it uses
collMod for validators, so it is safe to re-run, which matters for a demo.
Be honest that two of the validators are composite: $jsonSchema AND an $expr
cross-field check (booking completion not before booking date; invoice total equal
to subtotal plus tax).

=== SLIDE 3 — THE ER DIAGRAM, TWO LEVELS ===
Eyebrow: DESIGN · THE SIMPLIFIED VIEW
Headline: "One model, drawn at two levels of detail"
Show the two diagrams as a pair, with an arrow from physical to conceptual
labelled "simplify".
  PHYSICAL   14 tables · 16 relationships   (12 collections + 2 embedded arrays)
  CONCEPTUAL 13 entities · 15 relationships  (the simplified view)
What the conceptual diagram removes, so the simplification is explicit:
  - the users table (login accounts) — an implementation concern, not a domain entity
  - audit columns such as created_at
  - indexes and validator notes
  - storage detail: which things are embedded versus referenced
The 13 conceptual entities: CUSTOMER, VEHICLE, BOOKING, JOB_CARD, TASK, MECHANIC,
ASSIGNMENT, SPARE_PART, PART_USAGE, INSPECTION, INVOICE, LINE_ITEM, PAYMENT.
Two caveats to state on the slide, because the notation cannot:
  1. No relationship line is a foreign key. MongoDB has none; each is enforced in
     the service layer by a require() check that returns 404 on a missing parent.
  2. TASK and LINE_ITEM are not collections — they are arrays embedded in their
     parent. They appear as boxes only because DBML has no way to draw embedding.
Speaker note: the conceptual diagram is for the domain conversation, the physical
one for the implementation conversation. Neither contradicts the other.

=== SLIDE 4 — EMBED OR REFERENCE ===
Eyebrow: DESIGN · THE DECISIONS THAT MATTER
Headline: "Query patterns decided the schema"
Three decisions, each with its reason:
  tasks -> EMBEDDED in job_cards
    small, bounded, always read and written with the parent; updated in place with
    a positional operator: { "tasks._id": id }, { $set: { "tasks.$.status": s } }
  line_items -> EMBEDDED in invoices
    immutable once issued, always read with the parent
  assignments -> ITS OWN COLLECTION, deliberately not embedded in job_cards
    the no-double-booking rule needs a compound index on
    (mechanic_id, start_time, end_time); embedding would make that index unusable
Give the assignments decision the emphasis. It is the clearest example of a query
pattern dictating schema shape, and the likeliest design question.
Also: bookings carries a copy of customer_id taken from the vehicle at booking
time, a deliberate duplication so service history survives a change of owner.

=== SLIDE 5 — RELATIONAL RULES, REBUILT ===
Eyebrow: INTEGRITY · THE MAPPING
Headline: "What replaced each relational mechanism"
A ruled table:
  Relational mechanism         What was used instead
  UNIQUE constraint ........... unique index (registration_number, sku, email)
  FOREIGN KEY ................. service-layer require(); 404 on missing parent
  CHECK (stock >= 0) .......... atomic $inc guarded by $gte in the update filter
  Trigger, no double-booking .. compound index + overlap query inside a transaction
  CHECK (dates valid) ......... $expr validator + Pydantic validation
  Computed column (total) ..... server-side computation + $expr validator
State the one honest gap: declarative referential integrity was NOT recovered.
Deleting a customer does not cascade. It is enforced in application code, which is
weaker than a database constraint, and the report says so.

=== SLIDE 6 — THE THREE RULES, IN CODE ===
Eyebrow: INTEGRITY · WHERE QUESTIONS LAND
Headline: "Three rules, each in a transaction"
1. NO OVERLAPPING ASSIGNMENTS. Half-open interval [start, end):
     LEGAL     09:00-11:00 then 11:00-13:00   (touching)
     REJECTED  10:59-12:00                    (overlaps by one minute) -> HTTP 409
   Strict < and > make the boundary legal; <= and >= would wrongly reject it.
2. NO ISSUING BEYOND STOCK. The guard is in the update FILTER, not a
   read-then-write. Monospace:
     update_one({_id: part, stock_qty: {$gte: qty}}, {$inc: {stock_qty: -qty}})
   Two concurrent requests for the last unit cannot both succeed; the second
   matches zero documents. A read-check then unconditional $inc would let both in.
3. TOTALS COMPUTED, NEVER ACCEPTED. The request model has no `total` field and
   rejects an unknown one with HTTP 422. A $expr validator rejects any stored
   document where total != subtotal + tax.
Then a callout box titled "A bug the tests found": the losing request in the
concurrent part-issue first failed with a raw MongoDB write conflict, so the API
answered 500 instead of 409. MongoDB labels these TransientTransactionError and
the documented fix is to retry the transaction. Switching to the driver's
with_transaction fixed it: on retry the stock reads 0 and it fails cleanly as 409.
The test now asserts the error TYPE, not merely that it failed.
Side note for the speaker: transactions require a replica set; a single-node rs0
is enough locally, and a standalone mongod will not run this.

=== SLIDE 7 — SAMPLE DATA ===
Eyebrow: DATA · DETERMINISTIC SEED
Headline: "245 documents, the same every time"
A ruled table of exact counts:
  customers 15 · vehicles 20 · bookings 25 · job_cards 20 · mechanics 6 ·
  assignments 32 · spare_parts 20 · part_usage 40 · inspections 20 ·
  invoices 20 · payments 23 · users 4          total 245
The seed uses a fixed random seed, so the demo, the screenshots and the report all
show identical figures. The data deliberately contains the edge cases:
  - a pair of assignments that touch exactly (the legal boundary)
  - a zero-stock part, so the stock rule can be demonstrated live
  - invoices whose totals are computed, never literal
  - a mix of fully paid, partly paid and unpaid invoices
Four demo accounts, one per role: manager, receptionist, mechanic, customer.

=== SLIDE 8 — THE QUERIES ===
Eyebrow: QUERIES · AGGREGATION AND VIEWS
Headline: "Six pipelines replace the joins"
$lookup replaces JOIN, $group replaces GROUP BY, $unwind flattens arrays. The six
required reports: pending jobs · service history per vehicle · mechanic workload ·
spare-part usage · turnaround time · revenue by month. Two further endpoints feed
the dashboard (summary, centre health), for 8 report endpoints in all.
Show one pipeline in monospace:
    db.invoices.aggregate([
      { $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
          revenue:  { $sum: "$total" },
          invoices: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
Then the real output from the seeded data, as a small ruled table:
    2026-05   2 invoices    33,866.00
    2026-06   6 invoices    97,072.70
    2026-07   6 invoices    79,343.20
    2026-08   6 invoices    95,167.00     total 3,05,448.90
Add a second line of real output: turnaround time averages 2.34 days across 18
completed jobs, from 0.33 days fastest to 3.75 days slowest.
Dashed placeholder labelled "SCREENSHOT: dashboard" beside it.

=== SLIDE 9 — THE PROTOTYPE ===
Eyebrow: PROTOTYPE · LIVE DEMO
Headline: "Eight calls, eight expected results"
Stack: FastAPI + Motor (async) backend with 33 endpoints (18 GET, 12 POST, 3
PATCH); React 19 + TypeScript + Tailwind frontend; JWT + bcrypt auth with four
roles (customer, receptionist, mechanic, manager), a role guard on every endpoint.
Show the demo runbook as a ruled table. These were run against the live API on
the day of writing and all matched:
  1  POST assignment 09:00-11:00 ................ 201
  2  POST assignment 11:00-13:00, touching ...... 201  boundary is legal
  3  POST assignment 10:59-12:00, overlapping .... 409  names the conflicting one
  4  POST part_usage for a zero-stock part ....... 409  quotes SKU and stock on hand
  5  POST invoice containing a `total` field ..... 422  field forbidden
  6  GET report with no token .................... 401
  7  GET report as manager ....................... 200
  8  GET users as receptionist ................... 403
State the limitation plainly: of the five app screens, only the dashboard reads
the live API. Bookings, job cards, invoice and my-garage still render fixture
data, so the demo above is driven through the API and Swagger at /docs.
Dashed placeholder labelled "SCREENSHOT: Swagger UI showing a 409".

=== SLIDE 10 — TESTING, LIMITS, WHAT'S NEXT ===
Eyebrow: STATUS · REVIEW 3 AHEAD
Headline: "What is proven, and what is not"
PROVEN: 21 automated tests against a real MongoDB, not a mock — mocks cannot
reproduce transactions or the atomic $gte guard, which are exactly what is under
test. They cover: touching versus overlapping windows, issuing exactly the
remaining stock versus one more, the concurrent race for the last unit, tampered
and wrongly-signed JWTs, and the role matrix across all four roles.
LIMITATIONS, say them plainly:
  - no declarative referential integrity (slide 5)
  - transactions require a replica set; a standalone mongod will not run this
  - the single-node replica set gives no real fault tolerance; it exists to enable
    transactions, not for availability
  - four of five frontend screens still run on fixture data
REVIEW 3: wire the remaining screens to the API; build the missing vehicle
registration, mechanic-assignment and parts/stock screens; final demo and report.
Closing line: "The question I would like you to test is whether correctness
survived the move off a relational database."

=== TONE ===
Plain and specific. Prefer "the guard is in the update filter, so the second
concurrent request matches zero documents" over "we ensured data integrity".
Assume the audience knows what an index is. Volunteering what is unfinished reads
as competence; an evaluator who finds an unmentioned gap trusts the rest of the
deck less.
```

---

## Where each figure came from

| Claim | How it was measured |
|---|---|
| 21 tests passing | `pytest -q` on 2026-10-03 |
| 33 endpoints (18 GET, 12 POST, 3 PATCH), 8 report endpoints | the app's own OpenAPI schema |
| 12 collections, 5 validators, 18 indexes (5 unique), 2 views | imported straight from `scripts/init_indexes.py` |
| 245 documents and every per-collection count | live database count after re-seeding |
| 14 physical tables / 16 refs, 13 conceptual entities / 15 refs | `@dbml/core` parser — **not** a text grep, which over-counted by matching `TableGroup` lines |
| Eight demo results | run against the live API, then the database re-seeded clean |
| Revenue by month, 2.34-day turnaround | live `/api/reports/*` responses |

## What I did not do

- I did not touch the plan document. Sections 2 and 11 still say Jinja2.
- I did not mix in the crop-farm project's 18 → 8 simplification. That belongs to
  the other subject.
