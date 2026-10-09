# Handoff — Web Technologies (frontend fork)

_Forked 2026-09-08 from a combined session. The backend half continues elsewhere; see "Boundary" below._

**Read this, then `web/` — you do not need the Python side to work on the frontend.**

---

## What this is

`web/` inside `~/Documents/Vanta/03_PROJECTS/active/vsc-system/` — a
**Vite + React 19 + TypeScript + Tailwind 4** app for a vehicle service centre
("AutoCare"). ~3,400 lines. It talks to a FastAPI backend on `:8000`, which
Vite dev-proxies at `/api`, so there is no CORS config anywhere.

```bash
npm run dev --prefix web       # :5173
npm run build --prefix web     # tsc -b && vite build
npm run lint  --prefix web     # oxlint
```

The backend must be running for login and the dashboard to work:

```bash
.venv/bin/python -m uvicorn app.main:app --reload
```

MongoDB is a Homebrew login service and starts on boot. If it is not up:
`brew services start mongodb-community`.

**Demo logins** (password `autocare123`, click-to-fill on the sign-in page):
`manager@autocare.example` · `desk@autocare.example` ·
`mechanic@autocare.example` · `ananya.rao@example.com`

---

## Routes

| Route | Screen | Guard |
|---|---|---|
| `/` | Landing (Lenis smooth scroll) | public |
| `/auth` | Sign in / register | public |
| `/app` | My garage | any signed-in |
| `/app/dashboard` | Six report panels | staff |
| `/app/bookings` | Calendar + booking list | staff |
| `/app/jobs` | Job card task board | workshop |
| `/app/invoice` | Payment → receipt | any signed-in |

---

## The design system — read before touching any styling

All of it lives in `web/src/index.css`. **Warm-neutral neomorphic**, deliberately
not the default AI look: no Inter, no blue, no decorative gradients. Montserrat +
JetBrains Mono, warm bone/clay palette.

Four utility classes carry the whole visual language:

| Class | Use |
|---|---|
| `.neo` | raised — resting state of anything clickable |
| `.neo-sm` | raised, subtler |
| `.neo-inset` | pressed/inset — inputs, tracks, wells |
| `.neo-flat` | barely raised |
| `.neo-press` | swaps raised → inset on `:active` |

Two things that will break if you are not careful:

1. **Surfaces must stay mid-tone.** Neomorphism needs both a highlight and a
   shadow to read. Pure white backgrounds kill the effect entirely.
2. **The paper grain is on `body::before` only.** Raised elements stay clean, so
   the texture reads as the surface *behind* the controls. Do not add it to cards.

Dark mode inverts the shadow pair via `.dark`. Both themes are implemented and
verified — if you add a colour, define it in **both** blocks.

---

## Components — and what was deliberately changed

Eight components were supplied and integrated. Changes I made on purpose, so you
do not "restore" them by accident:

- **`@phosphor-icons/react` dropped.** Every icon it needed maps to
  `lucide-react`, which was already a dependency. Two icon libraries for one
  component is not worth ~500KB.
- **`@paper-design/shaders-react` (LiquidMetal button) dropped.** A WebGL
  dependency for one button. `animated-button.tsx` gets the same premium read
  with framer-motion and zero extra deps.
- **Cal.com embed omitted.** A third-party scheduler competes with the booking
  and mechanic-assignment logic that is the core of the backend.
  The calendar is built off the app's own booking data.
- **Google/Apple sign-in buttons removed.** They were wired to nothing.

---

## Live data vs fixtures — the main thing to know

**Only the dashboard is on the real API.** Everything else still imports
`web/src/lib/mock-data.ts`.

| Screen | State |
|---|---|
| `Dashboard.tsx` | **LIVE** — `useReports()` in `web/src/lib/reports.ts` |
| `Bookings.tsx` | fixtures |
| `Jobs.tsx` | fixtures |
| `Invoice.tsx` | fixtures |
| `MyGarage.tsx` | fixtures |

`useReports` is the pattern to copy: it fires all seven report requests with
`Promise.all` (sequential awaits would make the page as slow as their sum),
carries a `cancelled` flag so an unmounted component does not set state, and
surfaces the backend's own error message rather than blank panels.

**Endpoints that already exist for the remaining screens:**
`GET /api/bookings?status=` · `GET /api/job_cards/{id}` ·
`PATCH /api/job_cards/{id}/tasks/{task_id}` · `POST /api/part_usage` ·
`POST /api/invoices` · `POST /api/payments` · `GET /api/spare_parts`
Full list at <http://localhost:8000/docs>.

Wiring `Jobs.tsx` to `POST /api/part_usage` is the highest-value next step —
it turns the out-of-stock failure toast from a simulation into a real 409.

---

## Auth

`web/src/lib/auth.tsx` — `AuthProvider`, `useAuth()`, and an `api()` fetch
wrapper that attaches the bearer token and clears it on 401.
`ProtectedRoute.tsx` guards routes by role.

**The route guard is a convenience, not a security boundary.** Every endpoint is
guarded server-side in `app/auth.py`. Hiding a route here without guarding the
API would leave the data reachable by anyone who knows the URL. `STAFF` and
`WORKSHOP` in `auth.tsx` mirror the backend guards — keep them in step.

---

## Bugs already found and fixed — do not reintroduce

- **`AnimatePresence mode="wait"` stranded the payment flow.** It gates the
  receipt behind the payment card's *exit animation completing*. Clicking Pay
  left you on the form forever. Replaced with a plain conditional. Do not gate a
  **state transition** behind an animation finishing.
- **A `useEffect` syncing props to state in `job-card-list.tsx`** could never
  fire, because `Jobs.tsx` passes `key={active.id}`, which remounts the
  component anyway. Removed.
- **A dead Unsplash ID** in the auth showcase. Test image URLs before committing
  them; `naturalWidth === 0` after load means the URL is dead.
- **Dead code removed:** unreferenced `card.tsx`, `href="#"` footer links,
  Vite boilerplate README, unused role arrays, three unused palette variables.

---

## Known quirks

- **An API outage logs you out.** `AuthProvider` bootstraps via `/auth/me` and
  treats *any* failure — including a network error — as signed-out. The token
  survives, so a reload once the API is back signs you straight in. Worth
  distinguishing 401 from network failure eventually.
- **`~/.claude/launch.json` no longer has the `autocare-web` entry** — it was
  overwritten with an unrelated config. `preview_start` by name will fail; use
  `npm run dev --prefix web`.
- **Preview-tab animation freeze.** In a hidden browser tab, `requestAnimationFrame`
  pauses, so framer-motion `whileInView` height animations freeze at 0px and
  charts look empty. This is a harness artifact, not a bug — the maths is fine.
  Verify chart values by reading the data, not by screenshotting.

---

## Not built yet

- Customer / vehicle registration form
- Mechanic-assignment screen (**the most valuable one** — the no-overlap rule is
  the hardest-probed backend logic and has no UI at all)
- Parts / stock management screen
- `PATCH /bookings/{id}` rescheduling UI (endpoint does not exist either)

---

## Boundary with the backend session

**Yours:** everything under `web/`, plus the design system and anything about
how screens consume the API.

**Theirs:** `app/`, `scripts/`, `tests/`, `docs/`, MongoDB schema, business
rules and aggregation pipelines.

**Shared:** the API contract. If you need an endpoint that does not exist, say
so — do not add it to `app/` from this session, or the two forks will conflict
in the same repo.

Both forks share one git repo. Commit only files under `web/` from here.
