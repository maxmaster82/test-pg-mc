## Context

Empty repository; Node 24, pnpm 11, Docker 29 and OpenSpec 1.6 are available locally. The assessment mandates Vue 3, Pinia or Vuex, Vue Router, TypeScript, Docker and a mock API with fixtures, and evaluates architecture, testing and engineering judgment. This change fixes the cross-cutting architecture that every later change builds on.

## Goals / Non-Goals

**Goals:**

- One obvious place for every kind of code (domain, shared UI, API, mocks).
- Server state and client state handled by different, fit-for-purpose tools.
- A mock backend realistic enough that swapping it for a real API changes only the base URL.
- Tooling that fails fast: strict types, lint, format, tests, a buildable Docker image.

**Non-Goals:**

- A generic CRUD framework or schema-driven page generator.
- Server-side rendering, i18n, real authentication.

## Decisions

### D1. Folder structure (domain-oriented)

```
src/
  app/            main.ts, App.vue, router/, providers (pinia, query client), layouts/, pages/ (Overview, NotFound, Login lives in auth)
  modules/
    auth/         api.ts, store.ts, guards.ts, pages/, components/
    tickets/      api.ts (repository), queries.ts (query keys + composables), schemas.ts, types.ts, components/, pages/
    events/       same shape
    categories/   same shape
  shared/
    api/          http.ts (client), errors.ts (ApiError), types.ts (Paginated<T>, ListParams)
    ui/           Button, TextField, SelectField, Combobox, Dialog, ConfirmDialog, DataTable, Pagination, Toasts, EmptyState, ErrorState, Skeleton
    composables/  useMediaQuery, useDebouncedRef, useListQueryState, useConfirm
    utils/        format (money, dates, numbers, country), money (minor units), query-string
    validation/   shared zod primitives (nonEmptyTrimmed, money, isoDate)
  mocks/          browser.ts, node.ts, handlers/<resource>.ts, db/ (store, list-engine, persistence), fixtures/ (seeded generators)
```

A separate top-level `pages/` folder was rejected: pages are owned by their module, which keeps a domain deletable/extractable as a unit. Rule: `modules/*` may import `shared/*`; `shared/*` never imports `modules/*`; nothing outside `src/mocks` and test setup imports `src/mocks` (enforced by ESLint `no-restricted-imports`). Cross-module imports go through the module's public files (`api.ts`, `queries.ts`, `types.ts`) only.

### D2. Server state: TanStack Query for Vue

Chosen because the product genuinely needs: query keys derived from URL list params with `placeholderData: keepPreviousData` (no table flicker while paging), automatic `AbortSignal` cancellation of superseded searches (race conditions), cross-entity invalidation after mutations (e.g. renaming an event must refresh ticket lists), and snapshot/rollback for the optimistic bulk update. Alternatives: hand-written Pinia stores per resource (re-implements caching, dedupe, cancellation and stale handling — more code, more bugs); Pinia Colada (Vue-native and lighter, but younger with a smaller ecosystem; reasonable alternative, recorded in ADR). Defaults: `staleTime` 30s, `retry` 1 for queries on 5xx/network only, never for 4xx, `retry` 0 for mutations, `refetchOnWindowFocus` true.

### D3. Client state: Pinia only for genuine client state

`auth` (token, user, session restore), `preferences` (theme, persisted), `notifications` (toast queue). **Implementation note:** mock developer settings (latency/failure) and "Reset demo data" are exposed by the mock API itself at `/api/__dev/*` and consumed over HTTP by `app/demo/DemoControls.vue`, so the UI never imports mock code (no Pinia store needed). Server data is never copied into Pinia. Page-local state (table selection, dialog state) stays in component/composable scope.

### D4. API layer

`shared/api/http.ts` exposes `http.get/post/patch/delete<T>(path, { query, body, signal })`. Per-module repositories (`modules/tickets/api.ts`) expose intention-revealing functions (`listTickets(params, signal)`, `updateTicket(id, input)`) returning domain types. DTOs equal domain types except where transformation is real: money is integer minor units on the wire and in the domain, and converted to/from decimal only at the form boundary (`toFormValues`/`toPayload` in `schemas.ts`). A blanket DTO→model mapping layer was rejected as ceremony with no current payoff; the repository function is the seam where one would be added.

### D5. Mock API: MSW v2 + in-memory database

MSW intercepts `fetch` at the network layer, so the app's HTTP client, headers, status codes and error parsing are exercised for real, in the browser and in Vitest (`msw/node`) with the same handlers. Alternatives: json-server (needs a second process and a Node server inside the Docker image; weak custom business rules), MirageJS (patches fetch in-app, less maintained). Components: `db/` holds typed collections plus referential rules; `list-engine.ts` implements search/filter/sort/paginate once for all resources; handlers validate bodies with the same Zod schemas as the forms (single source of truth for constraints) and return the error envelope. Fixtures come from a seeded PRNG (mulberry32) with hand-written name pools — no faker dependency, fully deterministic. Because the Docker demo has no backend, MSW runs in the production build as well, controlled by `VITE_API_MOCKING` (default `true`); this is documented as a demo-only trade-off.

### D6. Forms and validation: Zod + in-house `useZodForm` (revised during implementation)

Zod schemas in each module's `schemas.ts` define constraints and messages once and are reused by the mock API. **Implementation note:** the planned VeeValidate integration failed the bootstrap spike — VeeValidate 4.15 silently accepted invalid input with a Zod 4 schema (no Standard Schema support; `@vee-validate/zod` requires Zod 3; VeeValidate 5 is beta). The documented fallback was taken: `shared/validation/useZodForm.ts` (touched/dirty/submitting state, validate-on-blur, server `fieldErrors`, focus first invalid field). See ADR 0006.

### D7. UI: Reka UI primitives + Tailwind CSS v4 tokens

Reka UI supplies accessible Dialog (navigation drawer), AlertDialog (confirmations), DropdownMenu and Combobox behavior (focus trap, roving focus, ARIA). Visuals come from thin wrappers in `shared/ui` styled with Tailwind using CSS custom-property tokens defined once in `app/styles/main.css` (`@theme`), with a `[data-theme='dark']` override. **Implementation note:** toasts are an in-house `ToastRegion` (two permanent live regions, polite and assertive) rather than Reka Toast, because the spec requires explicit control over live-region politeness and pause-on-hover/focus; native `<select>` is used for simple choices (better mobile UX than a custom listbox). A full component library (PrimeVue, Vuetify) was rejected: heavier, harder to style consistently, and it would hide the component design the assessment evaluates.

### D8. Formatting

`Intl.NumberFormat` for money (from minor units + currency) and numbers, `Intl.DateTimeFormat` for dates in the user's locale and time zone, `Intl.DisplayNames` for country names from ISO 3166-1 alpha-2 codes. All in `shared/utils/format.ts` with unit tests.

### D9. Docker

Multi-stage: `node:24-alpine` with corepack/pnpm builds `dist/`; `nginxinc/nginx-unprivileged:1.29-alpine` (non-root) serves it with SPA fallback, long-cache headers for hashed assets, `no-cache` for `index.html` and `mockServiceWorker.js`, and a `HEALTHCHECK`. `docker-compose.yml` maps port 8080. Service workers require a secure context; `http://localhost` qualifies, which is the documented way to run the container.

## Risks / Trade-offs

- [MSW shipped in the production bundle] → Loaded via dynamic import only when `VITE_API_MOCKING=true`; documented; a real deployment sets it to `false`.
- [Service worker not active on first load → early requests bypass mocks] → `worker.start()` is awaited before `app.mount()`.
- [localStorage persistence hides seed changes] → Versioned storage key; "Reset demo data" action.
- [Library integration churn (Zod 4, VeeValidate, Reka UI, Tailwind 4)] → Verified in the first task; VeeValidate dropped (D6). TypeScript pinned to 5.9 because typescript-eslint does not yet support TypeScript 7.
- [pnpm 11 in Docker] → Pin `packageManager` in `package.json`; corepack installs the same version.

## Validation plan

- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` all pass on the skeleton.
- Unit tests: list engine (search/filter/sort/paginate/fallbacks/stable order), seed determinism, `http` error normalization (500, 422 with field errors, HTML body, network failure, abort), format utils, notifications store (limit, dedupe, persistence of errors).
- Component tests: shell navigation `aria-current`, drawer open/close/focus return, 404 page, toast live regions.
- `pnpm build` succeeds; `docker build` succeeds; `curl localhost:8080/` and a deep link `curl localhost:8080/tickets` both return `index.html`.
