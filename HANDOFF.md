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

## Files & Resources
- Plan: `docs/vehicle_service_centre_mongodb_plan.md`
- Repo: this folder is the repo root (`vsc-system/` structure per plan Section 2)

## Decisions & Rationale
- **MongoDB over relational**: user's explicit choice (offered 3 options: strict relational / full Mongo / hybrid; picked full Mongo). **Instructor approved 2026-08-22.**
- **FastAPI + Motor (async)**: matches async Mongo driver, gives auto Swagger docs useful for the viva demo.
- **Jinja2 + Bootstrap over React**: simplest for a solo student project; React noted as optional upgrade if time allows. **User deferred the final call — build backend-only until ~week 13, decide then.**
- **assignments as its own collection (not embedded in job_cards)**: required to index `(mechanic_id, start_time, end_time)` for the no-overlap business rule — embedding would block this index.
- **Transactions require a single-node replica set**: documented explicitly since this is a common setup blocker.
- **Server-side invoice total computation only**: never trust client-supplied totals; `$expr` validator as a secondary safety net.
- **Tooling on this machine**: MongoDB via Homebrew tap (`mongodb/brew`), Python env via `uv` (system python is 3.9; brew has 3.10/3.14 — use uv-managed 3.12 for FastAPI stack).

## Dead Ends — Do Not Retry
(none this session — no implementation attempted yet)

## Open Items
- ~~Instructor sign-off on the MongoDB pivot~~ **Approved 2026-08-22.**
- Frontend choice (Jinja2 vs React) deferred — backend-only until ~week 13.
- Week 1–2 requirements/role docs and Section 3 conceptual-design deliverables not yet written.
- `graphify` CLI is broken machine-wide (shebang → `/opt/homebrew/opt/python@3.13/bin/python3.13`, which is gone; brew has 3.10/3.14). Project not yet in the global graph; fix = reinstall/relink graphify against a current python, then run `graphify extract . --code-only --global --as vsc-system`.

## Next Action
> Draft the Week 1–2 requirements/role docs per plan Section 1, then the Section 3 conceptual-design write-up — both are Review 1 inputs.

---
_Please read any referenced files listed above and confirm you are oriented before we begin._
