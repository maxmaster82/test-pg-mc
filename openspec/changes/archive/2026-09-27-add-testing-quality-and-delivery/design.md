## Context

Final change: enforce and document. Test pyramid boundaries are defined here (and in ADR 0003) even though tests are written inside each change.

## Goals / Non-Goals

**Goals:** fast, trustworthy gates; a small, stable E2E suite; documentation a reviewer can verify.
**Non-Goals:** exhaustive E2E coverage (integration tests carry behavioral coverage).

## Decisions

- **Test pyramid.**
  | Layer                                                                                                                                                                                             | Tool                                                                      | Scope                                                                                                     |
  | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
  | Unit                                                                                                                                                                                              | Vitest                                                                    | utils, schemas, mappers, list engine, stores, non-trivial composables, cache transforms                   |
  | Integration                                                                                                                                                                                       | Vitest + Vue Testing Library + MSW (node) + real router/Pinia/QueryClient | whole pages and flows through the real HTTP client and mock handlers; queries by role/label; `user-event` |
  | E2E                                                                                                                                                                                               | Playwright + MSW in browser                                               | ~10 smoke journeys on the production build, desktop and mobile; axe                                       |
  | Tests assert user-visible behavior and API contracts, never component internals. A `renderWithApp(route)` helper creates fresh router/Pinia/QueryClient (retry off) and a fresh mock db per test. |
- **E2E against `vite preview`** of the production build, so what is tested is what Docker serves; latency set to 0 via `VITE_MOCK_LATENCY=0`, db reset per test via `localStorage` clear.
- **CI** (GitHub Actions): install with frozen lockfile → format/lint/typecheck → tests with coverage → build → Playwright → Docker build + smoke. Committed but not pushed without the owner's permission.
- **Docs are written last from the code**, and the traceability matrix links each requirement to tests by file name.

## Risks / Trade-offs

- [E2E flakiness] → role-based locators, web-first assertions, no fixed sleeps, deterministic data, retries only in CI (1).
- [Coverage as vanity metric] → thresholds only on logic-heavy folders; not on pages.

## Validation plan

- Run `pnpm verify` locally from a clean install; run Docker smoke script; follow README from a fresh clone in a temp directory; check every TECHNICAL_REVIEW question is answered; check every traceability row has a test or artifact reference.
