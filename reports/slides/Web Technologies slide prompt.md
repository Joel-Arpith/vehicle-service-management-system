# Slide prompt — Web Technologies

Paste the fenced block into an AI slide tool (Gamma, Claude, ChatGPT, Copilot in
PowerPoint). Self-contained — the tool cannot see the repo, so every figure is
stated inline and it is told not to invent any.

**Every number below was measured, not recalled** — `npm run build`,
`npm run lint`, and counts over `web/src` on 2026-09-21.

> ⚠ **I do not have your Web Technologies brief.** This is written as a general
> full-project presentation. If your subject has a numbered review with its own
> required deliverables (for example Review 1 / 2 / 3), tell me and
> I will re-scope it. Right now it presents everything, which is wrong if you are
> only meant to present a slice.

---

```
You are helping me build a slide deck for my Web Technologies project
presentation. Audience: my course evaluator plus faculty. They will ask about
implementation choices, not just look at screenshots.

Produce a 13-slide deck. For each slide give a title, an ALL-CAPS eyebrow label,
3–5 terse bullets, and a speaker-note paragraph I can say aloud. No "In this
presentation we will..." slide. Do not invent any figure — every number I need
is below, and they must match exactly.

=== DESIGN DIRECTION ===
Editorial and restrained, not corporate-template. Each slide: a small ALL-CAPS
eyebrow label above a large plain-English headline. Generous white space. Code
and data in monospace. Numbers big and unadorned. No stock photography, no
clip-art icons, no gradients, no drop shadows. One warm accent colour used
sparingly; everything else near-black on off-white. Ruled-line tables, no fills.

=== TITLE ===
AutoCare — a Vehicle Service Centre Web Application
React 19 · TypeScript · Vite · Tailwind CSS 4

Slide 1 stat strip, exactly:
3,419 lines · 16 components · 7 routes · 166 KB gzipped

=== SLIDE 2 — THE PROBLEM THE INTERFACE SOLVES ===
Do not open with the tech stack. Open with the user problem:
A customer hands over their car and goes silent for a day. They cannot see what
was found, what it will cost, or whether work they never approved has started.
The garage answers the same phone call five times.

The interface exists to make the work visible:
- Book a slot against real mechanic availability
- Follow the job card task by task as each is completed
- Approve extra work before it starts
- Pay against an invoice computed from the work actually recorded

Speaker note: every screen in this app maps to one of those four.

=== SLIDE 3 — ARCHITECTURE ===
A single-page React app talking to a JSON API over HTTP.

  Browser  ──►  React SPA (Vite dev server :5173)
                    │  fetch /api/*
                    ▼
                FastAPI (:8000)  ──►  MongoDB

Key decision to call out: the Vite dev server **proxies** /api to :8000, so the
browser only ever sees one origin. That removes CORS configuration entirely —
there is no CORS middleware anywhere in this project. In production the same
effect comes from serving the built assets behind the API.

=== SLIDE 4 — STACK, AND WHY EACH ===
React 19.2 + TypeScript — component model, and types catch prop and API-shape
  mistakes at build time rather than in the browser
Vite 8 — dev server with HMR; production build runs `tsc -b && vite build`, so
  a type error fails the build
Tailwind CSS 4 — utility-first, with the design system expressed as CSS custom
  properties rather than a config file
React Router 7 — client-side routing with nested layout routes
Framer Motion — animation
Radix UI primitives — accessible dialog, label, slot
Lenis — smooth scroll, landing page only
lucide-react — icons

Two deliberate rejections, state them plainly:
- A second icon library was dropped; every icon it provided already existed in
  lucide-react. Two icon sets for one component is not worth ~500 KB.
- A WebGL shader library was dropped; it existed to style one button. The same
  effect was rebuilt with Framer Motion and zero new dependencies.

=== SLIDE 5 — THE DESIGN SYSTEM ===
Warm-neutral neomorphic. Deliberately not the default framework look: no Inter,
no blue, no decorative gradients. Montserrat + JetBrains Mono, bone and clay.

66 CSS custom properties. Six utility classes carry the whole visual language:
  .neo         raised — the resting state of anything clickable
  .neo-sm      raised, subtler
  .neo-inset   pressed — inputs, tracks, wells
  .neo-flat    barely raised
  .neo-press   swaps raised to inset on :active
  .shimmer     loading skeleton sweep

Two constraints that make it work, and are the interesting part:
1. Surfaces must stay mid-tone. Neomorphism needs a highlight AND a shadow to
   read; a pure white background kills the effect entirely.
2. The paper grain sits on `body::before` only. Raised elements stay clean, so
   the texture reads as the surface *behind* the controls, not on them.

Dark mode re-declares the tokens under `.dark` and inverts the shadow pair.
Both themes are implemented, not just the light one.

=== SLIDE 6 — COMPONENT ARCHITECTURE ===
16 components: 14 presentational in components/ui, plus AppShell (the
authenticated layout) and ProtectedRoute (the route guard). 7 page components.

Composition pattern worth showing: pages own data and state; ui components take
props and render. ReportsBento receives its slice as a prop — no component
fetches on its own. That is why the dashboard can swap fixtures for live API
without touching a single chart.

Show one signature as evidence:
  <ReportsBento data={data} />        // data: ReportsData, fetched by the page

=== SLIDE 7 — ROUTING AND ROLE-BASED ACCESS ===
7 routes, with nested layout routes:
  /                public   landing
  /auth            public   sign in / register
  /app             signed-in   my garage
  /app/dashboard   staff    reports
  /app/bookings    staff    calendar
  /app/jobs        workshop job cards
  /app/invoice     signed-in   payment

Four roles: customer, receptionist, mechanic, manager.

**Say this out loud, it is the point of the slide:** the route guard is a
convenience, not a security boundary. Every endpoint is guarded server-side.
Hiding a route in the client without guarding the API would leave the data
reachable by anyone who types the URL. The client guard only stops a user
landing on a page that will fail.

=== SLIDE 8 — STATE AND DATA FETCHING ===
React Context for auth (AuthProvider, useAuth). No Redux, no external state
library — one context and local component state cover everything here.

A thin `api()` wrapper attaches the bearer token and unwraps API errors.

The dashboard fetches seven endpoints with Promise.all. Explain why: sequential
awaits would make the page as slow as the sum of all seven. It also carries a
`cancelled` flag so a resolved fetch does not set state on an unmounted
component, and it surfaces the backend's own error message rather than
rendering blank panels.

=== SLIDE 9 — TWO BUGS WORTH SHOWING ===
This is the most interesting slide. Evaluators reward finding real bugs.

BUG 1 — an animation blocked a state transition.
The payment screen used AnimatePresence with mode="wait", which holds the next
component until the previous one's EXIT animation completes. Clicking Pay left
the user on the payment form indefinitely — the receipt never mounted.
Fix: a plain conditional render. Lesson: never gate a state transition behind
an animation finishing.

BUG 2 — an effect that could never fire.
job-card-list had a useEffect syncing props into state. But the parent passes
key={active.id}, which unmounts and remounts the component on change, so
useState re-initialises anyway. The effect could only ever cause one extra
render. Fix: deleted. Lesson: `key` already resets state — a sync effect on top
of it is dead code.

=== SLIDE 10 — RESPONSIVE AND ACCESSIBLE ===
Mobile-first Tailwind breakpoints, 68 usages: sm 34, lg 23, md 9, xl 2.
Layouts collapse from multi-column bento to single column.

Accessibility measures actually present: 7 aria-labels on icon-only buttons,
4 aria-hidden on decorative SVG, 1 aria-live on the alert toast, 1
aria-expanded on the FAQ accordion, 1 sr-only label, semantic landmarks, and a
prefers-reduced-motion block that disables animation.

**Be honest here** — say that accessibility is present but thin, that a full
WCAG audit has not been done, and that contrast on the low-contrast neomorphic
surfaces is the most likely failure. Volunteering that beats being asked.

=== SLIDE 11 — BUILD AND PERFORMANCE ===
Production build, measured:
  index.html     0.92 kB   gzip   0.50 kB
  CSS           43.98 kB   gzip   8.70 kB
  JS           533.06 kB   gzip 165.82 kB
  built in 301 ms

Do not hide this: the JS bundle exceeds Vite's 500 kB warning threshold. There
is no code-splitting — every route ships in one chunk. The fix is route-level
React.lazy with Suspense; it is not done. 166 kB gzipped is acceptable for a
project of this size, and saying so is better than pretending the warning
is not there.

Type safety is enforced at build: `tsc -b && vite build` means a type error
fails the build, not the browser.

=== SLIDE 12 — WHAT IS AND IS NOT DONE ===
Working end-to-end: landing page, authentication with four roles, role-based
navigation, and the reports dashboard rendering live data from the API.

Not finished, say it plainly:
- Only the dashboard consumes the live API. Bookings, job cards, invoice and
  my-garage still render from fixture data.
- No frontend tests. No Vitest, no Testing Library, no Playwright. The backend
  has 21 tests; the frontend has none.
- Ten lint warnings outstanding, none breaking: eight react-refresh `only-export-components`, one `set-state-in-effect`, one `immutability`.
- An API outage signs the user out, because the auth bootstrap treats any
  failure — including a network error — as unauthenticated.

=== SLIDE 13 — WHAT COMES NEXT ===
Wire the remaining four screens to the API — the endpoints already exist.
Add Vitest and Testing Library, starting with the auth guard and the report hook.
Route-level code splitting to get under the bundle warning.
Build the three screens that do not exist yet: vehicle registration, mechanic
assignment, and parts/stock management.

=== TONE ===
Plain and specific. Prefer "mode=\"wait\" holds the next component until the
previous one's exit animation finishes, so the receipt never mounted" over "we
fixed a UI bug". Assume the audience knows what a component is. Volunteering
what is unfinished reads as competence, not weakness.
```

---

## Where each figure came from

| Claim | Source |
|---|---|
| 3,419 lines · 16 components · 7 pages · 7 routes | counted over `web/src` |
| 533.06 kB JS / 165.82 kB gzip, 301 ms | `npm run build` output |
| 66 custom properties, 6 utility classes | parsed from `src/index.css` |
| 7 aria-label, 4 aria-hidden, 1 aria-live, 1 aria-expanded, 1 sr-only | grepped `web/src` |
| 68 breakpoints — sm 34, lg 23, md 9, xl 2 | grepped `web/src` |
| no test tooling | `devDependencies` has no vitest/jest/testing-library/playwright |
| 10 lint warnings (8 / 1 / 1 by rule) | `npm run lint` |

## The honest bits, deliberately included

Slides 10, 11 and 12 each admit a real shortfall — thin accessibility, a bundle
over the warning threshold, zero frontend tests, four screens still on fixtures.
Leave them in. An evaluator who finds an unmentioned weakness trusts the rest of
the deck less; one who hears it volunteered trusts it more.
