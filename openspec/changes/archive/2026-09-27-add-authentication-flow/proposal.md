## Why

The assessment requires a login page (mockable) that gates access to the admin portal. Route protection, session restore and expiry handling are also the first real consumer of the API client and Pinia, so they validate the foundation early.

## What Changes

- Mock endpoints `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` with a single seeded demo administrator; all other `/api` endpoints require a valid bearer token.
- `auth` Pinia store: token + user, persisted to `localStorage`, `restoreSession()` via `/me` on app start.
- Login page with validated email/password form, error feedback and demo-credential hint.
- Router guards: `meta.requiresAuth` (default for the shell) and `meta.guestOnly` (login); `redirect` query preserved and sanitized.
- Global 401 handling: clear session, clear query cache, redirect to login with a "Your session has expired" message.
- User menu with logout.
- Non-goals: registration, password reset, roles/permissions, refresh tokens.

## Capabilities

### New Capabilities

- `authentication`: login, logout, session restore, route protection, expiry handling.

### Modified Capabilities

- None.

## Dependencies

- `bootstrap-frontend-architecture` (API client `onUnauthorized` hook, mock backend, shell, notifications).

## Impact

- `src/modules/auth/*`, `src/app/router/*`, `src/mocks/handlers/auth.ts`, shell user menu.
