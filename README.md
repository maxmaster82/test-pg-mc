# Ticket Management Admin Portal

[![Live demo](https://img.shields.io/badge/Live%20demo-open%20the%20app-3b4fd8?style=for-the-badge)](https://maxmaster82.github.io/test-pg-mc/)
[![CI](https://github.com/maxmaster82/test-pg-mc/actions/workflows/ci.yml/badge.svg)](https://github.com/maxmaster82/test-pg-mc/actions/workflows/ci.yml)
[![Deploy](https://github.com/maxmaster82/test-pg-mc/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/maxmaster82/test-pg-mc/actions/workflows/deploy-pages.yml)

## Live demo

**➡️ [https://maxmaster82.github.io/test-pg-mc/](https://maxmaster82.github.io/test-pg-mc/)**

|              |                          |
| ------------ | ------------------------ |
| **Email**    | `admin@ticketadmin.test` |
| **Password** | `demo-password`          |

These credentials are fake and only work with the mock API. Nothing needs to be installed: the API runs inside your browser, and changes you make are saved in your browser only. Use **Demo → Reset demo data** to start over, or **Demo → Simulated failures** to see the error and retry states.

**Things to try:**

- **Tickets:** search, filter, sort and paginate. The URL updates as you go, so any view can be shared or bookmarked.
- **Bulk update:** select several tickets and change their status at once. Include a ticket with quantity 0 and set it to _On sale_ to see the partial-failure rollback.
- **Protected delete:** delete an event that still has tickets. It is refused, with a link to its tickets.
- **Other screens:** open the app on a phone, or switch the theme in the user menu (top right).

**Contents:** [Project overview](#project-overview) · [How this was built with AI](#how-this-was-built-with-ai) · [Installation](#installation-instructions) · [Development](#development-commands) · [Docker](#docker-setup) · [Build](#build-commands) · [Testing](#testing-commands) · [Project structure](#project-structure) · [Architecture](#architecture-overview) · [Technical decisions](#technical-decisions) · [Assumptions and trade-offs](#assumptions-and-trade-offs) · [Technical review](TECHNICAL_REVIEW.md)

---

## Project overview

A Vue 3 admin portal for managing **events**, **ticket categories** and **tickets**, built as the foundation of a production admin platform. There is no real backend: a mock REST API runs in the browser (MSW) with deterministic seed data, and the application talks to it exactly as it would to a remote API.

- Mocked sign-in with protected routes and session expiry handling.
- Full create/read/update/delete for events, categories and tickets.
- Search, filtering, sorting and pagination, all kept in the URL.
- Validation shared by forms and the mock API; loading, empty, error and retry states; toast notifications.
- Responsive layouts (desktop, tablet, mobile), keyboard support, screen-reader announcements, and light/dark/system themes.
- **Bonus:** bulk ticket status updates with optimistic UI, full rollback on failure, and per-ticket rollback on partial failure.

## How this was built with AI

The project was built with an AI coding agent inside a spec-driven, gated workflow. The agent did most of the typing; I owned the requirements, the key decisions and the acceptance of every step. The whole trail is in the repository, so each claim below can be checked.

| The brief asks how you…      | What I did                                                                                                                                                                                                                                                                                                                                                                 | Evidence                                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **provide context**          | Wrote a detailed kickoff prompt: role, two phases with a hard approval gate, guardrails, and a definition of done. The assessment PDF was treated as requirements to analyse, not as instructions. Persistent context lives in `AGENTS.md` and `openspec/config.yaml` (stack, architecture rules, per-artifact rules), so every session starts from the same ground truth. | [kickoff prompt](docs/ai/kickoff-prompt.md), [`AGENTS.md`](AGENTS.md), [`openspec/config.yaml`](openspec/config.yaml)                               |
| **define requirements**      | Phase 1 produced no code, only specifications: every requirement classified and mapped in a traceability matrix; 15 explicit assumptions; 7 OpenSpec changes with proposals, **87 GIVEN/WHEN/THEN scenarios**, designs and **96 tasks**; ADRs for decisions that are hard to reverse. I reviewed the plan and approved it before implementation started.                   | [traceability](docs/REQUIREMENTS_TRACEABILITY.md), [specs](openspec/specs/), [archived changes](openspec/changes/archive/), [ADRs](docs/decisions/) |
| **guide the implementation** | One change at a time, in dependency order. Each change was a vertical slice: implement → tests → focused checks → diff review → tick tasks only with evidence → archive into the living specs. Shared abstractions were extracted only once a third module needed them.                                                                                                    | [workflow log](docs/AI_WORKFLOW.md)                                                                                                                 |
| **iterate on the output**    | Proposals were accepted, changed or rejected, with the reason logged. For example: the form library was dropped after a failed spike; a Pinia store for mock settings became HTTP endpoints; whole-snapshot rollback became per-ticket rollback; a generic CRUD page was rejected.                                                                                         | [summary table](docs/AI_WORKFLOW.md#summary-how-ai-was-used)                                                                                        |
| **validate the results**     | Nothing counted as done on the AI's word: `pnpm verify` (format, lint, types, 218 tests with coverage thresholds, build, 13 E2E), real-browser checks, screenshots at 5 widths, axe in both themes, and the E2E suite run against the Docker image.                                                                                                                        | [QA checklist](docs/qa/accessibility-responsive-checklist.md), CI badge above                                                                       |

**What verification caught** (all fixed, with tests where possible):

- A form library that silently accepted invalid input (VeeValidate 4 + Zod 4), caught by a spike test before any form existed.
- Users being logged out on a transient server error, caught in the browser.
- The layout collapsing at exactly 1024 px because CSS and JS breakpoints disagreed, caught by a real-browser audit.
- Focus lost to `<body>` after dialogs and busy buttons, caught by tests and in a real browser.
- Duplicate event names and events starting at 3 AM in the seed data, caught by reviewing the UI.
- A timing-based test that would have been flaky in CI, replaced with deterministic gating.

**Where I made the call:** the approval gate itself; TanStack Query vs. Pinia stores; restricting vs. cascading deletes; one deep bonus (bulk updates) instead of several shallow ones; scope cuts (no RBAC, no CSV); what gets published.

---

## Getting started

### Installation instructions

Requirements: **Node.js 24** (see `.nvmrc`) and **pnpm 11** (`corepack enable` installs the version pinned in `package.json`).

```bash
pnpm install
```

### Development commands

```bash
pnpm dev
```

Open http://localhost:5173 and sign in with the [demo credentials](#live-demo).

| Variable            | Default | Purpose                                                                                   |
| ------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `VITE_API_MOCKING`  | `true`  | Start the in-browser mock API. Set `false` to call a real backend at `/api`.              |
| `VITE_MOCK_LATENCY` | unset   | Fixed mock latency in ms. When unset, the Demo menu setting applies (default 250–600 ms). |

### Docker setup

```bash
docker compose up --build
```

Open **http://localhost:8080**. Use `localhost` (not an IP address): the mock API runs in a Service Worker, which browsers only allow on `localhost` or HTTPS. If the Service Worker cannot start, the page explains this instead of staying blank.

The image is built in two stages: Node 24 builds the app, then an **unprivileged nginx** (non-root, uid 101) serves it. It includes a fallback so deep links load the app, immutable caching for hashed assets, `no-cache` for `index.html` and the Service Worker, security headers, and a `/healthz` endpoint used by the Docker `HEALTHCHECK`.

```bash
./scripts/docker-smoke.sh
```

This builds the image, runs a container, waits until it is healthy, and checks `/`, a deep link, the worker script, `/healthz`, and that it does not run as root.

### Build commands

```bash
pnpm build
pnpm preview
```

`pnpm build` type-checks with `vue-tsc` first. `pnpm preview` serves the production build on http://localhost:4173.

## Testing commands

| Command                                              | What it runs                                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm test`                                          | Unit and integration tests (Vitest + Vue Testing Library + MSW in Node)                                                                    |
| `pnpm test:coverage`                                 | Same, with coverage thresholds (fails below the limits)                                                                                    |
| `pnpm test:e2e`                                      | Playwright smoke suite against the production build (desktop and mobile projects). First run once: `pnpm exec playwright install chromium` |
| `E2E_BASE_URL=http://localhost:8080 pnpm test:e2e`   | The same E2E suite against a running container                                                                                             |
| `pnpm lint` / `pnpm typecheck` / `pnpm format:check` | ESLint (strict type-checked + accessibility + import boundaries), `vue-tsc`, Prettier                                                      |
| `pnpm verify`                                        | Every gate above in order; this is what CI runs                                                                                            |

Current results: 218 unit/integration tests in 29 files (~94% line coverage), and 13 E2E tests that pass against both `vite preview` and the Docker image.

**What each layer covers** (see [ADR 0003](docs/decisions/0003-testing-boundaries.md)):

- **Unit:** utilities, money and date conversion, Zod schemas, the mock list engine, seed determinism, stores, composables, and the bulk-update cache transforms.
- **Integration:** whole pages rendered with the real router, Pinia, TanStack Query and HTTP client against the mock API. Tests query by role and label and use `user-event`. They cover search/filter/sort/pagination via the URL, race conditions, create/edit/delete, 422/409/404/500 handling, relationship rules, bulk updates, focus management, and axe checks.
- **E2E:** sign-in and route protection, a URL-driven list, the ticket create → edit → delete journey, refused event deletion, bulk update, a keyboard-only flow, a mobile journey, overflow at 5 widths, and axe (with colour contrast) in both themes.

## Architecture

### Architecture overview

```
 Page (modules/*/pages)
   │  URL state: useListQueryState (Zod-validated query string)
   ▼
 Query composables (modules/*/queries.ts)  ── TanStack Query cache (server state)
   │
   ▼
 Repository (modules/*/api.ts) ── shared/api/http.ts ── fetch /api/*
                                                            │
                                   (browser/tests) MSW ─────┘ → mocks/handlers → in-memory db
 Client state: Pinia (auth session, theme preference, notifications)
```

- **Server state** (anything from the API) lives only in TanStack Query. Keys come from each module's `keys.ts`. Writes invalidate what they affect: for example, renaming an event refreshes ticket lists, because tickets embed event names. List queries keep the previous page visible while the next one loads, and cancel requests that have been superseded.
- **Client state** lives in Pinia: the auth session, theme preference, and toast queue. Ephemeral page state, such as the bulk selection, stays in the page.
- **URL as the source of truth for lists:** `useListQueryState` parses the query string with a Zod schema. Invalid values fall back to defaults and the URL is rewritten to its canonical form (defaults omitted). Typing a search replaces the history entry; paging, sorting and filtering push a new one.
- **Forms:** Zod schemas define constraints and messages once, and the mock API validates request bodies with the same schemas. `useZodForm` handles touched/dirty state, focuses the first invalid field, and shows server field errors from 422 responses. Shared composables cover the create/edit/delete patterns, including optimistic concurrency (a `version` field, where 409 offers "Load latest version").
- **Mock API:** MSW handlers over a typed in-memory database seeded from a fixed-seed PRNG (8 categories, 24 events, 250 tickets). One list engine implements search, filters, whitelisted sorting with an `id` tiebreak, and pagination for every collection. Responses use a consistent error envelope (`VALIDATION_ERROR` 422, `NOT_FOUND` 404, `CONFLICT` 409, `UNAUTHORIZED` 401, `INTERNAL_ERROR` 500).

### Project structure

```
src/
  app/            composition root: App.vue, router, query client, layout, overview/404 pages,
                  theme preference, demo controls
  modules/        one folder per business area; it owns its API calls, queries, schemas, types, UI and pages
    auth/         sign-in, session store, route guards, user menu
    tickets/      ticket CRUD + bulk/ (selection, optimistic bulk status update)
    events/       event CRUD, countries, local ↔ UTC date conversion
    categories/   category CRUD
  shared/         code with no business knowledge
    api/          HTTP client, ApiError, pagination and list-parameter contracts
    composables/  URL list state, breakpoints, unsaved-changes guard, create/edit/delete helpers
    ui/           Button, fields, DataTable, pagination, dialogs, toasts, empty/error states…
    validation/   useZodForm, reusable Zod rules, save-error handling
    notifications/ toast store
    utils/        money (minor units) and Intl formatting
  mocks/          the mock backend (MSW): handlers, in-memory db, list engine, seeded fixtures
  test/           test setup, app renderer, matchMedia polyfill, axe helper
e2e/              Playwright specs
docker/           nginx config
openspec/         specifications: archived changes and current capability specs
docs/             ADRs, AI workflow log, requirements traceability, QA checklist
```

**Boundaries enforced by ESLint:** `shared/` never imports `app/` or `modules/`, and application code never imports `mocks/` (it only talks to `/api`).

### Technical decisions

| Decision           | Summary                                                                                        | Record                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Server state       | TanStack Query for API data; Pinia only for client state                                       | [ADR 0001](docs/decisions/0001-server-state-strategy.md)           |
| Mock API           | MSW + seeded in-memory database, same handlers in browser and tests, shipped in the demo build | [ADR 0002](docs/decisions/0002-mock-api-strategy.md)               |
| Testing            | Unit → integration (most coverage) → small E2E suite                                           | [ADR 0003](docs/decisions/0003-testing-boundaries.md)              |
| Responsive tables  | Semantic table ≥768 px (low-priority columns hidden below 1280 px), cards below 768 px         | [ADR 0004](docs/decisions/0004-responsive-table-strategy.md)       |
| Optimistic updates | Only for bulk status changes; per-ticket rollback on partial failure                           | [ADR 0005](docs/decisions/0005-optimistic-updates-and-rollback.md) |
| Forms              | Zod + small in-house `useZodForm` (VeeValidate 4 failed with Zod 4)                            | [ADR 0006](docs/decisions/0006-forms-and-validation.md)            |
| UI                 | Reka UI accessible primitives + Tailwind CSS v4 design tokens                                  | [ADR 0007](docs/decisions/0007-ui-primitives-and-styling.md)       |

## Assumptions and trade-offs

### Assumptions

- **Dashboard:** the "dashboard with search, filtering, sorting and pagination" is the admin portal itself. Each entity list provides those features, and the Overview page shows totals and tickets by status.
- **Roles:** there is a single administrator role, with no role-based permissions.
- **Money** is stored as integer minor units. Currencies are EUR, USD, GBP and CHF. A price of 0 is allowed (free tickets).
- **Ticket fields:** `quantity` is available inventory. Statuses are `draft`, `on_sale`, `paused` and `sold_out`, set manually. A ticket with quantity 0 cannot be put on sale in bulk.
- **Event fields:** statuses are `draft`, `published`, `cancelled` and `completed`. The country is an ISO 3166-1 alpha-2 code shown by name. Dates are entered in the browser's local time and stored as UTC. The end must be on or after the start.
- **Category names** are unique, ignoring case. The description is optional (at most 500 characters).
- **Deleting a referenced event or category is refused** with a 409 and the ticket count, never cascaded. The UI links to the affected tickets.
- **Concurrent edits:** records carry a `version`, and an update based on a stale version is rejected with 409.
- **Language and browsers:** the UI is English-only, formatting follows the browser locale, and only evergreen browsers are supported.

### Trade-offs

- **The mock API ships in the production bundle** because the demo has no backend. It is lazy-loaded (about 437 kB, MSW's own runtime) and disabled with `VITE_API_MOCKING=false`.
- **The session token is stored in `localStorage`** so reloads keep the session. A real backend should use an `HttpOnly`, `SameSite` cookie; the auth store is shaped so that change is local to it.
- **Overview counts reuse list endpoints** (one small request per figure) instead of a dedicated `/stats` endpoint.
- **Only the bulk update is optimistic.** Filtered lists can briefly show rows that no longer match until the refetch completes. Form saves are pessimistic on purpose.
- **Broad invalidation:** event and category writes invalidate all ticket queries. That is simple and correct at this scale, but a larger dataset would need targeted invalidation or server-pushed updates.
- **In-house form composable instead of a form library:** about 160 lines we own and test, but no field arrays or nested forms.
- **The inline theme script** in `index.html` prevents a flash of the wrong theme, but it would need a hash or nonce under a strict Content Security Policy.

See [TECHNICAL_REVIEW.md](TECHNICAL_REVIEW.md) for accepted technical debt and scaling notes.

## Deployment

- **GitHub Pages (live demo).** `.github/workflows/deploy-pages.yml` builds the app for the repository sub-path (`BASE_PATH=/<repo>/`) and publishes it on every push to `main`. The in-browser mock API means no backend is needed. GitHub Pages has no SPA fallback, so the workflow copies `index.html` to `404.html` and deep links still load the app. Preview the same build locally with `pnpm preview:pages` at http://localhost:4180/test-pg-mc/. One-time repository setting: **Settings → Pages → Source: GitHub Actions**.
- **Docker** (see [Docker setup](#docker-setup)). To run against a real backend, rebuild with the build argument `VITE_API_MOCKING=false` (see `docker-compose.yml`); the mock is then left out of the bundle.
