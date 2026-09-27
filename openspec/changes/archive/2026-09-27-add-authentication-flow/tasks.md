## 1. Mock API

- [x] 1.1 Seed demo administrator and token table in mock db; handlers for login, me, logout
- [x] 1.2 Require bearer token on all non-auth handlers (`route()` helper, `auth` option defaults to true); 401 envelope
- [x] 1.3 Verification: handler tests for success, invalid credentials, missing/invalid token, logout invalidation (`auth-api.spec.ts`)

## 2. Store and guards

- [x] 2.1 `modules/auth/api.ts` and `store.ts` (login, logout, restoreSession memoized, persistence)
- [x] 2.2 Router `meta` typing (`requiresAuth`, `guestOnly`, `title`, `section`), global guard (`install.ts`), safe redirect helper
- [x] 2.3 Wire `http` token provider and `onUnauthorized` handler (clear store + query cache + toasts, redirect with reason) via `createAppContext`
- [x] 2.4 Verification: store and redirect unit tests pass

## 3. UI

- [x] 3.1 Login page: validated form, alert region, busy state, demo credentials hint, expired-session message
- [x] 3.2 User menu in top bar (Reka DropdownMenu) with user name and "Sign out"
- [x] 3.3 Verification: integration tests for every `authentication` scenario pass (`login-flow.spec.ts`); manual browser check of failed and successful login
