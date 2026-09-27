## 1. Toolchain

- [x] 1.1 Scaffold Vite + Vue 3 + TypeScript (strict, `noUncheckedIndexedAccess`) with pnpm; add `.nvmrc` (24), `packageManager`, `.gitignore`, `.editorconfig`
- [x] 1.2 Configure ESLint flat config (vue, typescript-eslint strict-type-checked, vuejs-accessibility, `no-restricted-imports` for `src/mocks` and module boundaries) and Prettier; add `lint`, `format`, `format:check`, `typecheck` scripts
- [x] 1.3 Configure Vitest (jsdom), Vue Testing Library, user-event, `msw/node` setup, `matchMedia` polyfill with a controllable viewport; add `test`, `test:watch`, `test:coverage` scripts
- [x] 1.4 Verify Zod 4 + VeeValidate integration with a spike test → **failed** (silent pass on invalid input); fell back to `useZodForm`; recorded in ADR 0006
- [x] 1.5 Verification: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` pass

## 2. App foundation

- [x] 2.1 Create folder structure per design D1; `main.ts` installs Pinia, router, TanStack Query client (defaults per D2)
- [x] 2.2 Add Tailwind v4, design tokens (`@theme` in `main.css`, light + `[data-theme=dark]`), base typography and focus-visible styles
- [x] 2.3 Add `shared/utils/format.ts` and `money.ts` with unit tests
- [x] 2.4 Verification: unit tests for utils pass

## 3. API client

- [x] 3.1 Implement `shared/api/http.ts`, `errors.ts` (`ApiError`, `isApiError`, `NETWORK_ERROR`, abort detection), `types.ts` (`Paginated<T>`, page sizes, error envelope)
- [x] 3.2 Token provider and `onUnauthorized` hook registration (`configureHttp`)
- [x] 3.3 Verification: unit tests for all `api-client` spec scenarios pass (`http.spec.ts`)

## 4. Mock backend

- [x] 4.1 Seeded PRNG + fixture generators (8 categories, 24 events, 250 tickets); determinism test
- [x] 4.2 In-memory db with typed collections, reset, versioned `localStorage` persistence (browser only)
- [x] 4.3 Generic list engine (q, filters, whitelisted sort + id tiebreak, pagination with fallbacks); unit tests
- [x] 4.4 Handler utilities: error envelope helpers, latency, failure injection, auth check helper (`route()` wrapper)
- [x] 4.5 `browser.ts` (awaited before mount when `VITE_API_MOCKING` is not `false`) and `node.ts` for tests; developer settings and "Reset demo data" exposed as `/api/__dev/*` endpoints and a "Demo" menu (design D3 note)
- [x] 4.6 Verification: `mock-api` scenarios covered by tests (list engine, seed, lint boundary probe); UI-level persistence/reset verified in the browser

## 5. Notifications and base UI

- [x] 5.1 Notifications store (limit 3, dedupe 2s, error persistence, pause/resume) + in-house `ToastRegion` with polite/assertive live regions; tests
- [x] 5.2 Base components: AppButton, FormField, TextField, TextareaField, SelectField, ConfirmHost (+ `confirm()`), AppSpinner, SkeletonBlock, EmptyState, ErrorState (with retry), PageHeader, StatusBadge, AppCard, AppIcon
- [x] 5.3 Verification: component tests for toast behavior and confirm dialog focus/escape

## 6. Application shell

- [x] 6.1 `AppLayout` with sidebar ≥1024px, drawer <1024px, top bar, skip link, `aria-current`
- [x] 6.2 Routes: `/` Overview, catch-all NotFound; document title per route meta
- [x] 6.3 Verification: component tests for `app-shell` spec scenarios

## 7. Docker

- [x] 7.1 Multi-stage `Dockerfile` (non-root nginx), `docker/nginx.conf` (SPA fallback, caching and security headers, `/healthz`), `.dockerignore`, `docker-compose.yml`, `HEALTHCHECK`, `scripts/docker-smoke.sh`
- [x] 7.2 Verification: `docker build` succeeds; smoke script passes (`/`, `/tickets/123`, worker script, health, non-root); mock API active in the browser against the container
