## Context

Authentication is mocked, but the flow should behave like token-based auth against a real API so that replacing the mock is a backend concern only.

## Goals / Non-Goals

**Goals:** realistic login/logout/restore/expiry; guards that cannot be bypassed by deep links; no open redirects.
**Non-Goals:** real security (the token is an opaque random string issued by the mock), RBAC, refresh tokens.

## Decisions

- **Token storage in `localStorage`.** Chosen so reloads keep the session in the demo. Trade-off: XSS-readable. A production system should use an `HttpOnly`, `SameSite` session cookie issued by the backend; the store API (`token`, `user`, `isAuthenticated`) is designed so the cookie variant only drops the token field. Recorded in README trade-offs.
- **Session restore gate.** `auth.restoreSession()` runs once, memoized as a promise awaited by the global `beforeEach` guard, so the first protected route never renders with an unknown session and no login flash occurs.
- **Guard shape.** Global `beforeEach`: await restore → `requiresAuth && !isAuthenticated` → `/login?redirect=fullPath`; `guestOnly && isAuthenticated` → `/`. `redirect` is accepted only if it starts with a single `/` and not `//`.
- **401 handling.** Registered in `main.ts` via `http.onUnauthorized`: `auth.clear()`, `queryClient.clear()`, `router.replace({ name: 'login', query: { redirect, reason: 'expired' } })`. Idempotent under concurrent 401s (flag reset after navigation).
- **Mock.** Demo user `admin@ticketadmin.test` with a documented demo password stored in the mock fixture file (not a secret; clearly labelled). Tokens are issued per login and kept in the mock db so logout invalidates them.

## Risks / Trade-offs

- [localStorage token] → documented; cookie migration path above.
- [Guard awaiting network on every cold start] → only the first navigation waits; mock latency is short.

## Validation plan

- Store tests: login success/failure, restore with valid/invalid token, logout clears state.
- Guard unit tests: redirect construction, open-redirect rejection, guestOnly.
- Integration tests (Testing Library + MSW): full login flow, invalid credentials message + focus, empty-form validation, deep link round trip, 401 mid-session redirect with message.
- E2E smoke (change `add-testing-quality-and-delivery`): login and protected-route redirect.
