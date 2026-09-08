# Handoff — Vehicle Service Centre Management System (Python + MongoDB)
_Last updated: 2026-08-23_
_Lives in Vanta at `03_PROJECTS/active/vsc-system/`._

## Current Goal
Week 1–2 of the 16-week timeline: environment setup and repo scaffold per plan Sections 2 & 13, then Week 1–2 requirements/role docs and Section 3 conceptual design deliverables.

## Work Done
- Clarified DB mismatch: original brief specified a relational DBMS (3NF, FKs); user chose **full MongoDB**, accepting the need to reframe those requirements.
- Produced full project plan artifact: `docs/vehicle_service_centre_mongodb_plan.md`
  - Covers: objectives/users/functional requirements, tech stack (FastAPI + Motor + MongoDB + Jinja2/Bootstrap), 11-collection conceptual design with embed-vs-reference rationale, `$jsonSchema` validators for key collections, business-rule enforcement mapping (unique reg. number, mechanic overlap, stock limits, valid dates, invoice totals), indexing plan, sample data plan, aggregation pipelines for all 6 required reports, feature-to-endpoint map, testing strategy incl. edge cases, 16-week timeline aligned to Review 1/2/3, report checklist, setup quickstart.
- 2026-08-22: moved both planning docs from Downloads into this Vanta project; instructor approved the MongoDB pivot; began env setup.
- 2026-08-22: environment live — uv-managed Python 3.12.13 venv with all 48 deps; MongoDB 8.3.7 via Homebrew running as a service with single-node replica set `rs0` (`replication.replSetName: rs0` appended to `/opt/homebrew/etc/mongod.conf`, `rs.initiate()` done once); repo scaffolded per plan Section 2 (minimal runnable `app/main.py` with `/health`, Motor client in `app/db.py`, env in `app/config.py`); git repo initialized on `main`. Verified: `scripts/init_indexes.py` connects, `/health` returns ok, Swagger 200 at `/docs`.
- 2026-08-23: re-verified — MongoDB service still running, nothing had drifted since the 08-22 setup. Made initial commit `d3d562a` on `main` (17 files, scaffold + plan doc).
- 2026-08-23: **backend implemented** — commit `2bd3bab`. Weeks 8–10 of the plan done in one pass: `$jsonSchema` + `$expr` validators, 11 indexes, 2 views (`scripts/init_indexes.py`); the three business-rule services (`app/services/rules.py`); six report pipelines (`app/services/reports.py`); all Section 9 endpoints (`app/routers/`); deterministic seed data (`scripts/seed_data.py`); 9 tests (`pytest -q`, all green). Verified by curl against seeded data: touching assignment windows → 201, 1-min overlap → 409, over-stock issue → 409, duplicate reg (incl. differing case/spacing) → 409, client-supplied invoice total → 422, overpayment → 422, all 5 list reports return real aggregates. Validators separately proven to reject bad writes when the service layer is bypassed.
- 2026-08-23: **frontend built early** — commit `0c3c0c2`. Vite + React 19 + TS + Tailwind 4 in `web/`, running on mock fixtures (`web/src/lib/mock-data.ts`) shaped after the plan's 11 collections. Screens: landing, auth, reports dashboard (all 6 aggregations), bookings calendar, job cards, invoice/payment. Verified in-browser: all screens render, part-issue failure toast fires on the out-of-stock clutch, invoice line items reconcile to the total, dark mode inverts, `npm run build` clean.

## Files & Resources
- Plan: `docs/vehicle_service_centre_mongodb_plan.md`
- Repo: this folder is the repo root (`vsc-system/` structure per plan Section 2)

## Decisions & Rationale
- **MongoDB over relational**: user's explicit choice (offered 3 options: strict relational / full Mongo / hybrid; picked full Mongo). **Instructor approved 2026-08-22.**
- **FastAPI + Motor (async)**: matches async Mongo driver, gives auto Swagger docs useful for the viva demo.
- ~~**Jinja2 + Bootstrap over React**~~ **REVERSED 2026-08-23**: user supplied eight React/shadcn components, so the frontend is now **Vite + React 19 + TS + Tailwind 4** in `web/`, built ahead of the week-14 slot. FastAPI becomes a pure JSON API; Vite dev-proxies `/api` to `:8000`, so no CORS config is needed. **Plan doc Section 2 and the Section 11 timeline still say Jinja2 — they need updating before Review 1, and the instructor should be told, as with the MongoDB pivot.**
- **Design lane**: warm-neutral neomorphic (CRED-like) with a paper-grain canvas, light + dark. Chosen over the source components' clashing languages (brutalist bento, glassmorphic checkout) so the app reads as one product.
- **Dependency trims from the component brief**: `@phosphor-icons/react` dropped (every icon maps to `lucide-react`, already required); `@paper-design/shaders-react` LiquidMetal button dropped (WebGL dep for one button — the framer-motion shine button replaces it).
- **Cal.com embed omitted**: a third-party scheduler competes with the booking + mechanic-assignment logic that *is* the graded deliverable. Native schedule view built off own booking data instead. Revisit only as a "contact the advisor" link.
- **Invoice totals derived, never literal**: `INVOICE_5521` in mock-data computes GST and total from line items, mirroring the server-side rule; a hardcoded total silently stops reconciling.
- **assignments as its own collection (not embedded in job_cards)**: required to index `(mechanic_id, start_time, end_time)` for the no-overlap business rule — embedding would block this index.
- **Transactions require a single-node replica set**: documented explicitly since this is a common setup blocker.
- **Server-side invoice total computation only**: never trust client-supplied totals; `$expr` validator as a secondary safety net.
- **Tooling on this machine**: MongoDB via Homebrew tap (`mongodb/brew`), Python env via `uv` (system python is 3.9; brew has 3.10/3.14 — use uv-managed 3.12 for FastAPI stack).

## Dead Ends — Do Not Retry
(none this session — no implementation attempted yet)

## Open Items

### Database / backend
- ~~Instructor sign-off on the MongoDB pivot~~ **Approved 2026-08-22.**
- **Plan doc still contradicts the code** — `docs/vehicle_service_centre_mongodb_plan.md` Section 2 and the Section 11 timeline still say Jinja2/Bootstrap at week 14. Not yet updated; the instructor has not been told about the React decision.
- Missing endpoints: `PATCH /bookings/{id}` (rescheduling). `inspections` now has a GET, added 2026-08-23.
- **`with_transaction` retries the callback**, so any new rule service written against `run_transaction` must be safe to run twice — re-read state inside the callback, never close over a value read outside it.
- Week 1–2 requirements/role docs and the Section 3 conceptual-design write-up are still unwritten.
- `graphify` CLI broken machine-wide (shebang points at a removed python@3.13). Project not in the global graph.

### Frontend
- **Dashboard is live on the API; every other screen is still on fixtures.** Bookings, Jobs, Invoice and MyGarage still import `web/src/lib/mock-data.ts`.
- Screens not built at all: customer/vehicle registration, mechanic-assignment, parts/stock management.
- An API outage logs the user out — `AuthProvider` bootstraps via `/auth/me` and treats any failure, including a network error, as signed-out. Token survives, so a reload once the API is back signs straight in.

### Environment
- **`~/.claude/launch.json` no longer contains the `autocare-web` entry** — it was overwritten with an unrelated `bd` config. `preview_start` by name will fail until it is re-added. Start Vite with `npm run dev --prefix web` instead.

## Running It
```bash
# one-time / after schema changes
.venv/bin/python scripts/init_indexes.py
.venv/bin/python scripts/seed_data.py

# backend — :8000, Swagger at /docs
.venv/bin/python -m uvicorn app.main:app --reload

# frontend — :5173, proxies /api → :8000
npm run dev --prefix web

# tests (needs mongod running)
.venv/bin/python -m pytest -q
```

---
_Please read any referenced files listed above and confirm you are oriented before we begin._
