# Presentation prompt

Paste everything inside the fence into an AI slide tool (Gamma, Claude, ChatGPT,
Copilot in PowerPoint). It is self-contained — the tool cannot see the repo, so
every fact it needs is stated.

Trim before pasting:
- **Review 1** — keep sections 1–4 and 10. Drop implementation, testing, demo.
- **Review 2** — add sections 5–7.
- **Review 3 / final** — paste whole.

---

```
You are helping me build a slide deck for my final-year Database Management
Systems project review. Audience: my course evaluator plus two faculty, all
database specialists. They will interrupt with questions. Marks come from
design justification and correctness, not visual polish.

Produce a 16-slide deck. For each slide give: a title, 3-5 terse bullet points,
and a short speaker-note paragraph I can actually say out loud. No filler, no
"In this presentation we will..." slides. Do not invent numbers — every figure
you need is listed below.

=== PROJECT ===
Vehicle Service Centre Management System. A multi-brand car service centre
books vehicles in, opens a job card, assigns mechanics to individual tasks,
issues spare parts from stock, and bills the customer. Built as a full-stack
application over MongoDB.

=== THE CENTRAL TENSION — MAKE THIS THE SPINE OF THE DECK ===
The brief specified a relational DBMS: 3NF, foreign keys, CHECK constraints.
I proposed MongoDB instead and my instructor approved the pivot. That trade is
the intellectual core of the project, so the deck must answer, head on:

  "You gave up foreign keys, CHECK constraints, triggers and computed columns.
   Prove you did not give up correctness."

Every relational guarantee was rebuilt explicitly and tested. Show the mapping
as a table slide:

  | Relational mechanism        | What I used instead                          |
  | Unique constraint           | Unique index (registration_number, sku, email)|
  | Foreign key                 | Service-layer check; 404 on missing parent    |
  | CHECK (stock_qty >= 0)      | Atomic $inc guarded by $gte in update filter  |
  | Trigger (no double-booking) | Compound index + overlap query in transaction |
  | CHECK (dates valid)         | $expr validator + Pydantic                    |
  | Computed column (total)     | Server-side computation + $expr validator     |

Be honest about the one thing not recovered: MongoDB has no declarative
referential integrity. Deleting a customer will not cascade. It is enforced in
application code, which is weaker, and I say so rather than hiding it.

=== SCHEMA ===
12 collections: customers, vehicles, bookings, job_cards, mechanics,
assignments, spare_parts, part_usage, inspections, invoices, payments, users.
Plus 2 embedded arrays: job_cards.tasks[] and invoices.line_items[].
5 $jsonSchema validators, 18 indexes, 2 views.

Three embed-vs-reference decisions worth a slide each — this is where design
marks live:
- tasks EMBEDDED in job_cards: small, bounded, always read and written with
  the parent. Updated in place with a positional operator.
- assignments as ITS OWN COLLECTION, deliberately not embedded: the
  no-double-booking rule needs a compound index on
  (mechanic_id, start_time, end_time). Embedding would make that index
  unusable. This is the single best example of a query pattern dictating
  schema shape — give it a full slide.
- line_items EMBEDDED in invoices: immutable once issued, always read with
  the parent.

=== THE THREE BUSINESS RULES (the demo, and where the questions land) ===

1. A mechanic cannot hold two overlapping assignments.
   Half-open interval test [start, end). Touching windows are LEGAL — an
   assignment ending 11:00 and the next starting 11:00 is fine. Overlapping by
   one minute returns HTTP 409 naming the conflicting assignment. Strict < and
   > are what make the boundary case work; <= and >= would wrongly reject it.
   Runs inside a transaction.

2. A part cannot be issued beyond stock on hand.
   The guard lives in the update FILTER, not in a read-then-write:
     update_one({_id: part, stock_qty: {$gte: qty}}, {$inc: {stock_qty: -qty}})
   Two concurrent requests for the last unit cannot both succeed — the second
   matches zero documents and is rejected. A read-check followed by an
   unconditional $inc would let both through. Tested with asyncio.gather:
   exactly one wins, stock lands at 0, one part_usage record exists.

3. Invoice totals are computed, never accepted.
   The API request model has no `total` field at all, and extra="forbid"
   rejects one if sent (HTTP 422). Server sums line items, applies tax. A
   $jsonSchema $expr validator rejects any document where
   total != subtotal + tax, as a second line of defence.

Mention one real bug this surfaced, because evaluators reward it: the losing
side of the concurrent part-issue initially failed with a raw MongoDB write
conflict, so the API answered 500 instead of a meaningful 409. MongoDB labels
these TransientTransactionError and the documented fix is to retry the
transaction. Switching to the driver's with_transaction fixed it — on retry the
stock reads 0 and it fails cleanly as 409. The test now asserts the error TYPE,
not merely that it failed, so this cannot regress silently.

=== REPORTING (the joins / aggregation requirement) ===
Six reports, all aggregation pipelines. $lookup replaces JOIN, $group replaces
GROUP BY, $unwind flattens embedded arrays:
  pending jobs · service history per vehicle · mechanic workload ·
  spare-part usage · turnaround time · revenue by month
Two are also exposed as MongoDB views, the equivalent of SQL views.

=== IMPLEMENTATION ===
Backend: FastAPI + Motor (async), MongoDB 8.3 on a single-node replica set
(rs0) — required because transactions do not work on a standalone mongod. Say
this explicitly; it is the setup step that trips everyone.
Frontend: React 19 + TypeScript + Tailwind, consuming the API.
33 endpoints. Auto-generated Swagger docs at /docs.
Auth: JWT + bcrypt, four roles (customer, receptionist, mechanic, manager),
role guard on every endpoint. Public registration always creates a customer —
accepting a role there would let anyone register as a manager.

=== TESTING ===
21 automated tests against a real MongoDB, not a mock — mocks cannot reproduce
transactions or the atomic $gte guard, which are precisely what is under test.
Edge cases covered: touching vs overlapping time windows, issuing exactly the
remaining stock vs one more, concurrent race for the last unit, tampered and
wrongly-signed JWTs, role matrix across all four roles.

=== SAMPLE DATA ===
Deterministic seed (fixed random seed, so the demo, the screenshots and the
report all show identical figures): 15 customers, 20 vehicles, 25 bookings,
20 job cards, 6 mechanics, 32 assignments, 20 spare parts, 40 part-usage
records, 20 invoices, 23 payments. Deliberately includes a zero-stock part and
a pair of exactly-touching assignments so the edge cases can be demonstrated
live rather than described.

=== LIVE DEMO — give this its own slide as a numbered runbook ===
1. Swagger at /docs, show the endpoint surface.
2. Create an assignment 09:00-11:00 → 201.
3. Create 11:00-13:00, touching → 201. Boundary case is legal.
4. Create 10:59-12:00, overlapping by a minute → 409 naming the clash.
5. Issue a part with 0 stock → 409 quoting SKU and stock on hand.
6. POST an invoice with a `total` field → 422, field forbidden.
7. Dashboard: six reports rendering live aggregation output.

=== HONEST LIMITATIONS — include this slide, do not skip it ===
- No declarative referential integrity; enforced in application code.
- Transactions require a replica set, so a standalone mongod will not run this.
- Denormalised customer_id on bookings is a deliberate duplication so service
  history survives a change of vehicle owner.
- Single-node replica set gives no real fault tolerance; it exists here to
  enable transactions, not for availability.

=== TONE ===
Plain and specific. Prefer "the guard is in the update filter, so the second
concurrent request matches zero documents" over "we ensured data integrity."
Assume the audience knows what an index is. Do not pad to reach 16 slides — if
a section is thin, merge it.
```
