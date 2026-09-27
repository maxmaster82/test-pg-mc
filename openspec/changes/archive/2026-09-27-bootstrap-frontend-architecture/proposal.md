## Why

The repository is empty. Every feature slice (auth, tickets, events, categories, bulk operations) needs the same foundation: a strict TypeScript Vue 3 toolchain, a typed API client, a realistic mock backend, a notification system, an application shell and quality tooling. Building it once, deliberately, prevents each slice from inventing its own patterns.

## What Changes

- Scaffold Vue 3 + Vite + TypeScript (strict) with pnpm, Node 24, ESLint (flat config, vue + typescript-eslint + vuejs-accessibility), Prettier, `vue-tsc`, Vitest + Vue Testing Library + jsdom.
- Establish the domain-oriented folder structure (`src/app`, `src/modules/*`, `src/shared`, `src/mocks`).
- Install and wire Vue Router, Pinia, TanStack Query (query client with sane defaults), Tailwind CSS v4 design tokens, Reka UI.
- Add a typed HTTP client (`fetch` wrapper) with normalized `ApiError`, `AbortSignal` support, JSON handling and an auth-token hook.
- Add the MSW mock backend: in-memory database, seeded deterministic fixtures for events, categories and tickets, configurable latency, a generic list-query engine (search, filter, sort, paginate) and simulated failure injection. Resource handlers are added by later changes.
- Add the notification (toast) system with an accessible live region.
- Add the application shell: responsive layout with sidebar navigation (drawer below 1024px), top bar, overview page placeholder route, 404 page.
- Add shared base UI components that are needed immediately (Button, TextField, SelectField, Dialog/ConfirmDialog, Spinner/Skeleton, EmptyState, ErrorState).
- Add a multi-stage Dockerfile (build with Node, serve with nginx, SPA fallback) and verify the image builds and serves the shell.
- Non-goals: feature pages, authentication logic, CI workflow, E2E tests (later changes).

## Capabilities

### New Capabilities

- `app-shell`: application layout, navigation, not-found handling.
- `mock-api`: behavior of the simulated remote API (envelope, list query contract, latency, errors, deterministic data).
- `api-client`: how the frontend talks to the API and normalizes failures.
- `notifications`: success/error toast behavior and accessibility.

### Modified Capabilities

- None (no existing specs).

## Dependencies

- None. All other changes depend on this one.

## Impact

- Creates the whole project skeleton, `package.json`, configs, `Dockerfile`, `nginx.conf`, `public/mockServiceWorker.js`.
- Runtime dependencies: vue, vue-router, pinia, @tanstack/vue-query, zod, vee-validate, reka-ui, msw (runtime in the demo build because no backend exists).
