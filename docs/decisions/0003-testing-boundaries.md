# ADR 0003 — Testing boundaries

- Status: Accepted (implemented; see notes below where the implementation differs from the proposal)
- Change: add-testing-quality-and-delivery (applied in every change)

## Decision

- Unit (Vitest): pure logic — utils, schemas, list engine, stores, composables, cache transforms.
- Integration (Vitest + Vue Testing Library + MSW node): full pages through real router, Pinia, QueryClient and HTTP client; role/label queries and `user-event`. This layer carries most behavioral coverage.
- E2E (Playwright, production build, MSW in browser): ~10 smoke journeys, desktop + mobile, plus axe.
- Never assert component internals (emitted events of private children, internal refs, CSS classes).

## Consequences

Fast feedback with high confidence; E2E stays small and stable. Coverage thresholds apply only to logic-heavy folders.

## Implementation notes

- `src/test/render.ts` renders the whole app (real router/guards, Pinia, QueryClient with retries off) at a route, optionally signed in; the mock DB, mock settings, the confirm-dialog singleton and body style locks are reset between tests.
- jsdom gaps are handled explicitly: a `matchMedia` polyfill with a controllable viewport, `TZ=Europe/Paris` for date tests, and axe without colour contrast (contrast is checked in Playwright).
- Timing-sensitive behavior (stale search responses, optimistic updates) is tested by gating mock responses with promises, not by sleeping.
- The E2E suite can target any running build via `E2E_BASE_URL` (used against the Docker image).
