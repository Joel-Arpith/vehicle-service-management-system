# Slide prompt — PBL Review 2 (AutoCare, web-technology focus)

Paste the fenced block into an AI slide tool (Gamma, Claude, ChatGPT, Copilot in
PowerPoint). Self-contained — the tool cannot see your repo, so every figure is
stated inline and it is told not to invent any. **10 slides, hard cap.**

**Rebalanced:** the first version spent 6 of 10 slides on the database (collections,
validators, indexes, pipelines). This one leads with the frontend — architecture,
stack, design system, components, routing, auth, live data — and gives the database
**one** slide, framed as what it hands the UI. The earlier version is in git history
if you want it back.

**Every number was measured on 2026-10-05** by running the build, lint, the code
counts and the API. Nothing in `web/` or `app/` has changed since.

> ## Read before you present
>
> **Only 1 of 5 app screens reads the live API** — the dashboard. Bookings, job
> cards, invoice and my-garage still render fixture data. The deck says so on slides
> 7 and 10. Do not demo those four as if they were wired.
>
> **The part-issue failure toast is a simulation.** On the job-card screen it fires
> against a fixture stock list, not the real API. The *real* 409 exists, but you
> reach it through Swagger at `/docs`, not through that screen. Slide 8 is written
> so you do not claim otherwise.
>
> **The plan document still says Jinja2/Bootstrap.** `docs/vehicle_service_centre_mongodb_plan.md`
> Sections 2 and 11 predate the switch to React, and your instructor was never told.
> If the plan is part of your submission, update it first.
>
> **I do not have your PBL Review 2 brief.** I took the deliverables from your plan,
> Section 11 week 11 (schema, scripts, sample data, queries, prototype demo) and
> weighted them toward the prototype. If your brief differs, tell me.
>
> **The ER-diagram detail was cut down to a single bullet** (slide 8) to make room
> for web content. If your brief requires an ER slide, say so and I will add one back.

---

```
You are helping me build a slide deck for Review 2 of my Project-Based Learning
(PBL) project: AutoCare, a web application for a vehicle service centre. Audience:
my course evaluator plus two faculty. This is a WEB TECHNOLOGY presentation first —
they will ask about architecture, framework choices, state, routing, auth,
performance and accessibility, and only secondarily about the database. They saw
Review 1, so do NOT re-explain the problem statement; build on it.

Produce EXACTLY 10 slides — no more. For each slide give a title, an ALL-CAPS
eyebrow label, 3-5 terse bullets, and a speaker-note paragraph I can say aloud.
No "In this presentation we will..." slide. Do not invent any figure: every number
is given below and must match exactly. Never fabricate screenshots; where I say a
screenshot goes, draw a dashed placeholder box labelled "SCREENSHOT".

=== DESIGN DIRECTION ===
Editorial and restrained, not corporate-template. Each slide: a small ALL-CAPS
eyebrow above a large plain-English headline. Generous white space. Code, routes
and JSON in monospace. Numbers big and unadorned. No stock photography, no
clip-art icons, no gradients, no drop shadows. One warm accent colour used
sparingly; everything else near-black on off-white. Tables are ruled lines only,
no fills. Placeholder boxes use a dashed outline.

=== PROJECT ===
AutoCare — a web application for a multi-brand vehicle service centre. A customer
books a slot, follows the job card task by task, approves extra work and pays
against a computed invoice. Staff run the workshop from the same app.
The interface exists to make the work visible: a customer who hands over a car
should not have to phone to learn what is happening to it.

=== SLIDE 1 — WHERE WE ARE ===
Eyebrow: REVIEW 2 · THE PROTOTYPE
Headline: "A working web app on a working API"
Status strip, led by the prototype:
  Frontend prototype .... RUNNING · 7 routes, 4 roles, 1 of 5 screens on live data
  API ................... 33 endpoints, JWT auth, role guard on every route
  Database .............. MongoDB · schema, scripts, sample data, queries done
Footer stat strip, exactly: 3,419 lines · 16 components · 7 routes · 14 runtime
dependencies
Be honest in the speaker note that the prototype is partly wired: the dashboard is
live, four other screens are not yet.

=== SLIDE 2 — ARCHITECTURE ===
Eyebrow: HOW THE PIECES FIT
Headline: "One origin, no CORS"
Draw this as a left-to-right diagram:
  Browser -> React SPA (Vite dev server :5173)
                |  fetch /api/*
                v
            FastAPI (:8000)  ->  MongoDB (replica set rs0)
Key decision: the Vite dev server PROXIES /api to :8000, so the browser only ever
sees one origin. That removes CORS configuration entirely — there is no CORS
middleware anywhere in this project. FastAPI is a pure JSON API; it serves no application pages, only its own Swagger docs.
Be candid that this describes the development setup: the app has not been
deployed. In production the same single-origin effect would come from serving the
built assets behind, or alongside, the API.
Build: `tsc -b && vite build`, so a TypeScript error fails the build rather than
reaching the browser.

=== SLIDE 3 — THE STACK, AND WHY EACH PIECE ===
Eyebrow: FRAMEWORK CHOICES
Headline: "Fourteen dependencies, each earning its place"
A ruled table:
  React 19.2 + TypeScript ... component model; types catch prop and API-shape
                              mistakes at build time
  Vite 8 .................... dev server with HMR; production build in ~270 ms
  Tailwind CSS 4 ............ utility-first; the design system is CSS custom
                              properties, not a config file
  React Router 7 ............ client-side routing with nested layout routes
  Framer Motion ............. animation
  Radix UI .................. accessible primitives: dialog, label, slot
  Lenis ..................... smooth scroll, landing page only
  lucide-react .............. one icon set
Two deliberate rejections, state them plainly:
  - a second icon library was dropped; every icon already existed in lucide-react,
    and two icon sets for one component is not worth ~500 KB
  - a WebGL shader library was dropped; it existed to style one button, which was
    rebuilt with Framer Motion at zero dependency cost
No Redux, no state library: one React context plus local state covers everything.

=== SLIDE 4 — THE DESIGN SYSTEM ===
Eyebrow: INTERFACE
Headline: "Warm-neutral neomorphism, built from tokens"
Deliberately not the default framework look: no Inter, no blue, no decorative
gradients. Montserrat for text, JetBrains Mono for data; a bone and clay palette.
66 CSS custom properties. Five utility classes carry the visual language:
  .neo        raised — the resting state of anything clickable
  .neo-sm     raised, subtler
  .neo-inset  pressed — inputs, tracks, wells
  .neo-flat   barely raised
  .neo-press  swaps raised to inset on :active
plus a .shimmer class for the loading skeleton.
Two constraints that make it work, and are the interesting part:
  1. Surfaces must stay mid-tone. Neomorphism needs a highlight AND a shadow to
     read; a pure white background kills the effect.
  2. The paper grain sits on body::before only, so it reads as the surface
     BEHIND the controls, not on them.
Dark mode re-declares the tokens under .dark and inverts the shadow pair. Both
themes are implemented. A prefers-reduced-motion block disables animation.
Dashed placeholder: "SCREENSHOT: light and dark side by side".

=== SLIDE 5 — COMPONENTS AND ROUTING ===
Eyebrow: STRUCTURE
Headline: "Pages own data; components take props"
16 components: 14 presentational in components/ui, plus AppShell (the
authenticated layout) and ProtectedRoute (the route guard). 7 page components.
7 routes, with nested layout routes:
  /                  public         landing
  /auth              public         sign in / register
  /app               signed in      my garage
  /app/dashboard     staff          reports
  /app/bookings      staff          calendar
  /app/jobs          workshop       job cards
  /app/invoice       signed in      payment
The composition rule worth stating: components never fetch on their own. The
reports panel receives its data as a prop:
    <ReportsBento data={data} />      // data fetched by the page
That is why the dashboard could swap fixtures for live API data without touching a
single chart.

=== SLIDE 6 — AUTH IN THE BROWSER ===
Eyebrow: SECURITY · THE CLIENT SIDE
Headline: "The route guard is not the security boundary"
The flow, as numbered steps:
  1. Sign in -> POST /api/auth/login returns a JWT and the user
  2. The token is stored in localStorage under "autocare.token"; it expires in 12 h
  3. A thin api() wrapper attaches it as a bearer header, and clears it on a 401
  4. On load, AuthProvider calls /auth/me to restore the session before any route
     decides, so a refresh does not bounce a signed-in user to the login page
  5. ProtectedRoute redirects unauthenticated users to /auth, remembering where
     they were going, and shows a "not available to your role" page otherwise
Four roles: customer, receptionist, mechanic, manager. The navigation changes with
role: a customer sees two links (My garage, Invoice); a manager sees five.
**Say this out loud:** hiding a route in the client does not protect data. Every API
endpoint is guarded server-side. The client guard only stops a user landing on a
page that would fail.
Two honest weaknesses, volunteer them:
  - a JWT in localStorage is readable by any script that runs on the page, so it
    is exposed to XSS; an httpOnly cookie would not be
  - any /auth/me failure, including a plain network error, reads as "signed out",
    so an API outage logs the user out. The token survives, so a reload once the
    API is back signs them straight in.

=== SLIDE 7 — LIVE DATA ===
Eyebrow: DATA FETCHING
Headline: "Seven requests, one pass, three states"
The dashboard is the live screen. It fires seven report requests with Promise.all.
Explain why: sequential awaits would make the page as slow as the sum of all
seven. It also carries a `cancelled` flag so a response arriving after the
component unmounted does not set state on it.
Three states are handled, not just the happy path:
  loading ... a skeleton that sweeps left to right (the .shimmer class)
  error ..... the backend's own message is shown, not a blank panel
  empty ..... each panel has its own "no data yet" state
A small ruled table of which screens are live:
  Dashboard ...... LIVE
  Bookings ....... fixture data
  Job cards ...... fixture data
  Invoice ........ fixture data
  My garage ...... fixture data
Say plainly that wiring the other four needs new endpoints first: a job-card
list, invoice reads, a customer's own vehicles, and bookings enriched with
registration number and customer name.
Dashed placeholder: "SCREENSHOT: dashboard on live data".

=== SLIDE 8 — WHAT THE DATABASE GIVES THE UI ===
Eyebrow: THE BACKEND, BRIEFLY
Headline: "Correctness lives below the interface"
This is the only database slide. Keep it to what the frontend depends on.
The backend: FastAPI + MongoDB on a single-node replica set (required for
transactions), 12 collections, 245 seeded documents, 33 endpoints, 21 tests passing
including a concurrent race for the last unit of stock.
Data model in one line: a 13-entity conceptual diagram, drawn out as a 14-table
physical one.
The point for a web audience: three business rules are enforced in the database
layer and reach the browser as HTTP status codes the interface must handle.
Show as a ruled table, with results from running the live API:
  no overlapping mechanic assignment ... 409   names the conflicting assignment
  issue a part beyond stock ............ 409   quotes the SKU and stock on hand
  invoice carrying a client `total` .... 422   field rejected; totals are computed
  report with no token ................. 401
  user list as a receptionist .......... 403
All five matched on a fresh run. The UI's job is to turn these into something a
person can act on.
BE HONEST HERE: the "part issue failed" toast on the job-card screen is a
SIMULATION driven by fixture stock, not the real API. The real 409 exists and is
shown through Swagger at /docs; wiring it into that screen is a next step.

=== SLIDE 9 — THE DEMO ===
Eyebrow: WHAT YOU WILL SEE
Headline: "A walk through the running app"
A numbered runbook for the live demo, all in the browser:
  1  Landing page: smooth scroll, the FAQ accordion, the track-your-car form
     (which sends the visitor to sign-in; it does not yet use the number typed in)
  2  Sign in as the customer account: two navigation links only
  3  Type /app/dashboard directly: blocked, "not available to your role"
  4  Sign out, sign in as the manager: five links, dashboard with seven live
     requests
  5  Toggle dark mode: the whole shadow system inverts
  6  Open the Swagger UI at /docs and send the overlapping assignment: a 409
Four demo logins, one per role, all password autocare123, click-to-fill on the
sign-in page: manager, receptionist, mechanic, customer.
Dashed placeholders: "SCREENSHOT: customer sees two links" and "SCREENSHOT:
Swagger returning a 409".
Note for the speaker: step 6 is the API, not the UI, because the assignment screen
does not exist yet.

=== SLIDE 10 — BUGS FOUND, WHAT IS UNPROVEN, WHAT IS NEXT ===
Eyebrow: STATUS · REVIEW 3 AHEAD
Headline: "Two real bugs, and an honest list of gaps"
Two bugs worth showing, because they show understanding of React's model:
  BUG 1 — an animation blocked a state transition. The payment screen used
  AnimatePresence with mode="wait", which holds the next component until the
  previous one's EXIT animation finishes. Clicking Pay left the user on the
  payment form indefinitely. Fix: a plain conditional. Lesson: never gate a state
  transition behind an animation finishing.
  BUG 2 — an effect that could never fire. A useEffect synced props into state,
  but the parent passes key={id}, which remounts the component anyway. Fix:
  deleted. Lesson: `key` already resets state.
Gaps, say them plainly:
  - 4 of 5 screens still on fixture data
  - no frontend tests at all: no Vitest, no Testing Library (the backend has 21)
  - the JS bundle is 533 kB (166 kB gzipped), over Vite's 500 kB warning, with no
    code-splitting
  - 10 lint warnings, none breaking
  - accessibility present but thin: 7 aria-labels, 4 aria-hidden, 1 aria-live,
    1 aria-expanded; no WCAG audit, and contrast on neomorphic surfaces is the
    likeliest failure
  - the landing page's headline figures ("12,400+ services", "4.8 / 5") are
    placeholder marketing copy, not data from the database
  - the track-your-car form redirects to sign-in but discards the registration
    number the visitor typed
Review 3: wire the remaining four screens, build the missing vehicle-registration,
mechanic-assignment and parts screens, add route-level code splitting, and add
tests starting with the auth guard and the reports hook.
Closing line: "The question I would like you to test is whether the interface can
be trusted to show only what each role is allowed to see."

=== TONE ===
Plain and specific. Prefer "mode=\"wait\" holds the next component until the
previous one's exit animation finishes, so the receipt never mounted" over "we
fixed a UI bug". Assume the audience knows what a component is. Volunteering what
is unfinished reads as competence; an evaluator who finds an unmentioned gap
trusts the rest of the deck less.
```

---

## Where each figure came from

| Claim | Source |
|---|---|
| 3,419 lines · 16 components · 7 pages · 7 routes · 14 runtime deps | counted over `web/src` and `package.json` |
| 533.06 kB JS / 165.82 kB gzip; built in ~270 ms | `npm run build` |
| 10 lint warnings | `npm run lint` — 8 `only-export-components`, 1 `set-state-in-effect`, 1 `immutability` |
| no test tooling | `devDependencies` has no vitest / jest / testing-library / playwright |
| 66 CSS custom properties · 5 utility classes + `.shimmer` | parsed from `index.css` |
| 7 aria-label · 4 aria-hidden · 1 aria-live · 1 aria-expanded | grepped over `web/src` |
| 1 of 5 screens live | checked which pages import `lib/reports` or call `api()` |
| 33 endpoints · 21 tests · 12 collections · 245 documents | OpenAPI schema, `pytest`, `init_indexes.py`, live database (re-run 2026-10-03) |
| 409 / 409 / 422 / 401 / 403 | live API calls (re-run 2026-10-03; `web/` and `app/` unchanged since) |
| customer sees 2 links, manager sees 5 | `AppShell` nav config; checked in the browser |

## A correction made while writing this

My earlier Web Technologies deck and `STATUS.md` said there were **3 lint
warnings**. There are **10**. I had read only the last three lines of the output.
Fixed in both files and committed separately.
