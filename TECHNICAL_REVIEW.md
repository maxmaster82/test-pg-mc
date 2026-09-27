# Technical Review

## 1. Main architectural decisions

1. **Domain modules with enforced boundaries.** `src/modules/{auth,tickets,events,categories}` each own their repository (`api.ts`), query keys and composables, Zod schemas, types, components and pages. `src/shared` holds code with no business knowledge (HTTP client, UI kit, composables, validation). `src/app` is the composition root. ESLint enforces two rules: `shared` never imports `app` or `modules`, and application code never imports the mock backend. A module can therefore be deleted or extracted as a unit.

2. **Server state vs. client state.** TanStack Query owns everything that comes from the API. Query-key factories make invalidation explicit (an event rename refreshes ticket lists; a ticket write refreshes event/category counts). `keepPreviousData` avoids table flicker while paging, and `AbortSignal` passthrough cancels superseded searches. Pinia holds only genuine client state: the session, the theme and the toast queue. Hand-written Pinia resource stores would have re-implemented caching, deduplication and cancellation (ADR 0001).

3. **The URL is the list state.** `useListQueryState` validates the query string with a Zod schema (invalid values fall back to defaults) and writes a canonical URL. Lists can be shared, the Back button works, and the same schema types the API request.

4. **One validation source.** Zod schemas define constraints and user-facing messages. Forms use them through `useZodForm`, and the mock API validates request bodies with the same schemas, so client and server cannot drift apart. Server 422 field errors land on the right field.

5. **A mock backend shaped like a real API (MSW).** A typed in-memory database with a seeded PRNG, one list engine (search, filters, whitelisted sort with a stable tiebreak, pagination), a consistent error envelope, authentication, optimistic-concurrency versions, relationship rules (409 when deleting a referenced record) and failure/latency simulation. The same handlers serve the browser, Vitest and the Docker build (ADR 0002).

6. **Accessible primitives, owned visuals.** Reka UI provides dialog, menu and combobox behavior (focus trapping, keyboard support, ARIA). The components in `shared/ui` wrap it with Tailwind design tokens, including a dark theme.

7. **Optimistic UI only where it pays off.** The bulk status update applies changes optimistically, rolls back fully on failure and per ticket on partial failure. The cache transforms are pure, unit-tested functions. Form saves stay pessimistic (ADR 0005).

## 2. What I would improve with two additional days

- **Server-side "select all matching the filter"** for bulk actions (a filter-based bulk endpoint, plus a job/progress model for large batches) instead of the 100-ticket client selection limit.
- **A `/stats` endpoint** for the Overview. It currently issues seven small list requests to read `meta.total` values.
- **Reassigning tickets from the refusal dialog** when deleting a referenced event or category ("Move 12 tickets to…"), instead of only linking to them.
- **Soft delete / archive** for events and categories, with an undo toast for ticket deletion.
- **A manual screen-reader pass** (VoiceOver and NVDA) and visual regression snapshots for the main screens. Accessibility is currently verified by axe, semantic tests and keyboard-only E2E tests.
- **CSV export** of the filtered ticket list (it reuses the list contract), and an audit trail of who changed what.
- **Route-level code-splitting review.** The main chunk is 187 kB (Vue, the router, TanStack Query, Reka UI, Zod). Lazy-loading Reka-heavy widgets and measuring with a bundle analyzer would reduce the first load.

## 3. Technical debt intentionally accepted

| Debt                                                                 | Why accepted                                                                                                   | Exit path                                                                                  |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| MSW shipped in the demo production bundle (lazy chunk, about 437 kB) | No backend exists; the Docker image must be usable on its own                                                  | `VITE_API_MOCKING=false` against a real API                                                |
| Session token in `localStorage`                                      | Keeps the demo session across reloads                                                                          | `HttpOnly` cookie issued by the backend; only the auth store changes                       |
| Broad invalidation (`tickets.*` on any event/category write)         | Simple and always correct at this scale                                                                        | Targeted keys or normalized entity updates                                                 |
| Seven list requests for Overview totals                              | No new endpoint needed for the assessment                                                                      | `/stats` endpoint                                                                          |
| In-house `useZodForm` (about 160 lines) instead of a form library    | VeeValidate 4 silently ignored Zod 4 schemas (see ADR 0006)                                                    | Re-evaluate VeeValidate 5 or TanStack Form when forms need field arrays or nested sections |
| Per-module list and detail page templates (similar markup ×3)        | Columns and fields differ enough that a configuration-driven page would be harder to read than the duplication | Revisit if a fourth or fifth entity is added                                               |
| Country list is a curated static subset                              | Enough for the domain demo                                                                                     | Server-provided reference data                                                             |
| Inline theme script in `index.html`                                  | Prevents a flash of the wrong theme                                                                            | Add a CSP hash when a CSP is introduced                                                    |

## 4. Which parts I would refactor first

1. **List pages.** `TicketsListPage.vue` now combines filters, table, bulk selection and pagination (about 280 lines). I would split it into a `TicketFilters` component and a `useTicketBulkActions` composable, keeping the page as the orchestrator.
2. **Mock API growth.** Handlers repeat the "find or 404 → validate → version check → save" steps for each entity. With a fourth resource I would extract a small `crudHandlers(definition)` helper, now that the real duplication is known.
3. **Error mapping.** `handleSaveError`, `useDeleteWithConfirm` and the list error states each map `ApiError` codes to UI. A single `presentError(error, context)` would keep wording consistent as more codes appear (e.g. 403 for role-based permissions).
4. **Query-key typing.** Keys are typed tuples but not tied to their query functions. `@lukemorales/query-key-factory` or an equivalent typed helper would remove the remaining casts at call sites.

## 5. Scaling to hundreds of thousands of tickets and multiple concurrent administrators

**Data volume**

- Everything is already server-side: search, filtering, sorting and pagination go through query parameters, and the UI never loads full collections. Pickers use server-side search (the event combobox) rather than loading all options.
- **Backend:** indexed filter and sort columns, full-text search (Postgres `tsvector` or OpenSearch) for `q`, and **cursor (keyset) pagination** for deep pages, because `OFFSET` degrades at scale. The list contract would add `cursor`/`nextCursor` alongside `page` for page-number navigation on the first pages.
- Totals become estimates, or are computed asynchronously, on very large filters ("about 120,000 tickets").
- **Frontend:** row virtualization (TanStack Virtual) if page sizes grow; `staleTime` tuned per resource; prefetching the next page on hover or when idle.
- **Bulk operations** move to the server: "apply to all tickets matching this filter" becomes an asynchronous job with progress reporting (polling or SSE) and a result report, replacing large client-side selections.

**Concurrent administrators**

- **Optimistic concurrency is already in place:** every write sends the `version` it was based on, and the API answers 409 on conflict. The UI explains the conflict and offers "Load latest version", and background refetches cannot hide it because the edit form keeps the version it was loaded with.
- **Live updates:** a WebSocket/SSE channel publishing `ticket.updated` / `event.deleted` events that call `queryClient.invalidateQueries` (or `setQueryData`) for the affected keys, so open lists and detail pages refresh without polling. Presence indicators ("Maria is editing this event") reduce conflicts before they happen.
- **Relationship integrity** stays on the server (409 for referenced deletes, 422 for missing references), so concurrent deletes cannot leave orphaned tickets. The UI already handles "the selected event no longer exists".
- **Auditability:** an audit log (who, what, before/after) and role-based permissions (403 handled through the same error mapping).
- **Operations:** request IDs in the `ApiError`, frontend error reporting (Sentry), and performance budgets for web vitals.

## 6. Coding standards and quality checks for the team

Already in place and enforced by `pnpm verify` and CI (`.github/workflows/ci.yml`):

- **TypeScript strict mode** plus `noUncheckedIndexedAccess`; `vue-tsc` on every build.
- **ESLint:** `typescript-eslint` strict type-checked, `eslint-plugin-vue` recommended, `vuejs-accessibility`, and import-boundary rules (`shared` ↛ `app`/`modules`, app ↛ `mocks`). Zero warnings allowed.
- **Prettier** formatting check.
- **Vitest with coverage thresholds** on logic-heavy code (85% global lines, 90% for `shared` and the mock database, 80% for module API/query/schema files). The thresholds were checked to fail when not met.
- **Playwright E2E suite** on the production build (desktop and mobile), including axe accessibility checks with colour contrast in both themes and overflow checks at five widths.
- **Docker build plus a smoke test** (health, deep links, non-root user).

I would add for a team:

- **Conventional commits + PR template** (what, why, screenshots for UI, which spec changed), required review from a code owner per module, and **OpenSpec changes for any behavior change**, so specs, tests and code move together.
- **Pre-commit hooks** (lint-staged: Prettier + ESLint on changed files) and `commitlint`.
- **Testing conventions:** query by role or label, assert user-visible behavior, no snapshot tests of markup, one integration test per spec scenario, and deterministic data (seeded fixtures, gated responses instead of sleeps).
- **Accessibility definition of done:** keyboard path, visible focus, labelled controls, announcements for async results, axe clean.
- **Dependency hygiene:** Renovate with grouped updates and a check of peer ranges (the TypeScript 7 / typescript-eslint mismatch shows why), plus `pnpm audit` in CI.
- **Performance budgets** (bundle size limits in CI), and Lighthouse CI on key pages once there is a deployed environment.
- **ADRs** for decisions that are expensive to reverse, as in `docs/decisions/`.

## 7. How AI fits into the daily development workflow

AI is useful here as a fast, tireless collaborator working inside a structure that makes its output reviewable. It does not replace engineering judgment. The workflow used on this project, and what I would keep:

1. **Context first.** `AGENTS.md` (architecture rules, conventions, quality gates) and `openspec/config.yaml` (project context and per-artifact rules) give every session the same ground truth, so the agent does not reinvent patterns.
2. **Specify before building.** Each feature starts as an OpenSpec change: proposal, GIVEN/WHEN/THEN scenarios, design and tasks. The human reviews that plan (this project had an explicit approval gate) before any code is written. Scenarios become integration tests almost one-to-one.
3. **Small vertical slices with verification after each.** The agent implements one change, runs lint, types and tests, checks the result in a real browser, and only then ticks tasks and archives the change. A task is never marked done without evidence.
4. **Trust but verify.** AI output is treated like a pull request from a fast junior-to-mid engineer. Several of its own assumptions were caught this way and are documented in `docs/AI_WORKFLOW.md`:
   - a form library that silently skipped validation;
   - a session store that logged users out on transient errors;
   - a CSS/JS breakpoint mismatch at exactly 1024 px;
   - focus lost to `<body>` after dialogs and disabled buttons;
   - flaky time-based tests.
     Real-browser checks and spike tests catch what type checks cannot.
5. **Where AI helps most:** scaffolding and configuration, exhaustive test scenarios (boundary values, error paths, accessibility), mock data and API contracts, refactors across many files, review checklists, and documentation that stays in sync with the code.
6. **Where the human decides:** architecture and trade-offs (for example TanStack Query vs. Pinia stores, restrict vs. cascade deletes), product behavior, when to extract an abstraction, security posture, and whether something is actually done.
