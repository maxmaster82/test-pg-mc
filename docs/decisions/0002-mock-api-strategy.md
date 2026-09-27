# ADR 0002 — Mock API with MSW and a seeded in-memory database

- Status: Accepted (implemented; see notes below where the implementation differs from the proposal)
- Change: bootstrap-frontend-architecture

## Context

No backend exists. The UI must be built and tested as if it talked to a remote REST API.

## Decision

MSW v2 handlers under `/api`, backed by a typed in-memory db seeded from a fixed-seed PRNG, with a single list engine (search/filter/sort/paginate), shared Zod validation, realistic error envelopes, configurable latency and failure injection. Same handlers run in the browser (service worker) and in Vitest (`msw/node`). Mutations persist to `localStorage` in the browser; tests use a fresh db. MSW also runs in the Docker production build (demo-only, flag-controlled).

## Alternatives

json-server (extra process, weak business rules, extra runtime in Docker); MirageJS (in-app fetch patching, less maintained); hardcoded arrays in components (not a real API boundary).

## Consequences

Real HTTP semantics in all environments; handlers double as an executable API contract. MSW ships in the demo bundle (dynamic import, flag off for real deployments).

## Implementation notes

- Developer controls (latency, failure simulation, reset) are exposed by the mock itself at `/api/__dev/*`, so the UI never imports mock code; ESLint enforces the boundary.
- The browser database is persisted under a versioned `localStorage` key; the version is bumped when the seed changes (it was bumped twice while fixing seed quality issues).
- The mock chunk in the production build is ~437 kB (MSW's browser runtime), lazy-loaded only when `VITE_API_MOCKING` is not `false`.
- If the Service Worker cannot start (non-secure origin, disabled workers), `main.ts` renders an explanation instead of a blank page.
