# Status — AutoCare (PBL Review 2 + Web Technologies)

_Last updated 2026-10-05. Figures measured by running the code that day._

## Review 2 scorecard (plan Section 11, week 11)

| Deliverable | State |
|---|---|
| Schema | **DONE** — 12 collections, 5 validators, 18 indexes (5 unique), 2 views |
| DDL-equivalent scripts | **DONE** — `scripts/init_indexes.py`, idempotent |
| Sample data | **DONE** — `scripts/seed_data.py`, 245 documents, deterministic |
| Queries | **DONE** — 8 aggregation pipelines, 8 report endpoints |
| Prototype demo | **DONE (2026-10-07)** — API fully working; Dashboard, Bookings, Job cards, Invoice and My garage all on live data |

## DONE

- Backend: 33 endpoints (18 GET · 12 POST · 3 PATCH), FastAPI + Motor, MongoDB on replica set `rs0`
- Three business rules, each in a transaction: mechanic no-overlap, stock guard, computed invoice totals
- Auth: JWT + bcrypt, 4 roles, a guard on every endpoint
- **33 tests passing** (5 new in `tests/test_views.py`)
- **2026-10-07:** wired Bookings, Jobs, Invoice and My garage to the API: new `GET /api/job_cards`, `/invoices`, `/invoices/{id}`, `/my/vehicles`, enriched `GET /api/bookings`; customers may pay their own invoice (404 on others, 403 for mechanics). Frontend: `web/src/lib/data.ts`; mock report data and fixtures deleted
- **28 tests passing** (12 auth, 9 rules incl. the concurrent race for the last unit of stock, 7 ownership)
- 8 demo calls re-run against the live API today — all matched (201, 201, 409, 409, 422, 401, 200, 403)
- Frontend: React 19 + TypeScript + Tailwind 4, neomorphic design system, light + dark
- Dashboard on live data (7 parallel fetches, error + loading + empty states)
- ER diagrams: conceptual (13 entities) and physical (14 tables), both parse
- Slide prompts: Web Technologies (13 slides) and PBL Review 2 (10 slides)
- **2026-10-05 fixes**, each verified after the change:
  - dashboard bar charts: tall bars rendered at one height (flex-shrink); now within 0.1% of the data (`d9697e5`)
  - accessibility: contrast tokens recalculated, `<main>` landmarks; Lighthouse a11y 94/97 → **100** on all four runs (`a5e9737`)
  - Swagger `/docs` had no Authorize button (no OpenAPI security scheme), so the demo's 409 call returned 401; `HTTPBearer` now declared (`41f7716`)
  - **IDOR fixed** (`ae26a26`): customers could read other customers' job cards, inspections and vehicles, and book on their cars. Now 404 (same as missing); 7 ownership tests, 5 of which failed on the old code. **28 tests**
  - Review 2 deck slides 6, 8 and 10 updated for the fix, Lighthouse 100 and 28 tests
- Reports: Web Technologies report in the Woxsen SEM 3 format (team: Joel 3011, Jayanth 3021, Sayan Bhowmick 3035, Hansith 3041), PDF + DOCX, and the Review 2 deck, in `~/Downloads/Project Reports/`

## IN PROGRESS

Nothing is actively being built in this repo. The Web Technologies fork session may
be working on `web/` — check `git log` before touching it; both sessions share this repo.

## PENDING

### Security
| Item | Note |
|---|---|
| JWT in localStorage | readable by any injected script; httpOnly SameSite cookie instead |

### Frontend (the Web Technologies half)
| Item | Note |
|---|---|
| ~~Wire Bookings, Jobs, Invoice, My-garage~~ | done 2026-10-07 |
| Build the 3 missing screens (New-booking dialog is still not persisted either) | vehicle registration · **mechanic assignment** (the no-overlap rule has no UI at all) · parts/stock |
| Frontend tests | none; no Vitest / Testing Library installed |
| Code-splitting | JS bundle is 533 kB, over Vite's 500 kB warning |
| API outage signs the user out | `/auth/me` failure of any kind reads as signed-out |
| 10 lint warnings | 8 `only-export-components`, 1 `set-state-in-effect`, 1 `immutability`; none breaking |
| Footer "Track your car" → `/app/jobs` | a customer is not allowed on that route, so the link ends at the role page |
| My garage shows fixture vehicles | the demo customer's real vehicles are KA 10 HA 1938 and KA 03 SH 1116 |
| Two API error shapes | rule/auth errors `{error, message}`; Pydantic 422 and unknown routes `{detail}`. Client handles both; one handler would unify |
| `robots.txt` | the only Lighthouse SEO failure (SPA fallback serves index.html) |

### Backend endpoints the four fixture screens need
- `GET /api/job_cards` (list) — only get-by-id exists
- `GET /api/invoices`, `GET /api/invoices/{id}` — only POST exists
- a customer-scoped "my vehicles" endpoint
- `GET /api/bookings` enriched with registration number and customer name
- `PATCH /api/bookings/{id}` for rescheduling

### Paperwork
| Item | Note |
|---|---|
| **Plan doc is out of date** | Sections 2 and 11 still say Jinja2/Bootstrap, frontend at week 14. The app is React. **The instructor has not been told.** |
| Week 1–2 requirements and Section 3 write-up | never written |
| `graphify` CLI broken machine-wide | shebang points at a removed python@3.13 |

## Run it

```bash
.venv/bin/python scripts/init_indexes.py && .venv/bin/python scripts/seed_data.py
.venv/bin/python -m uvicorn app.main:app --reload     # :8000, Swagger at /docs
npm run dev --prefix web                              # :5173
.venv/bin/python -m pytest -q                         # 21 tests, needs mongod
```
