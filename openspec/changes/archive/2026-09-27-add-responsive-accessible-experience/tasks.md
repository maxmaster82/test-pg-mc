## 1. Preferences

- [x] 1.1 `preferences` store (theme) with persistence and live `system` tracking; tests
- [x] 1.2 No-flash inline theme script; theme options in the user menu; reduced-motion CSS
- [x] 1.3 Verification: tests pass; both themes checked in Playwright screenshots and axe runs

## 2. Responsive audit

- [x] 2.1 Filters disclosure below 768px with active count (`FilterPanel`)
- [x] 2.2 Checked all pages at 320/390/768/1024/1440; fixed the 1024px grid/sidebar mismatch and small card-title touch targets
- [x] 2.3 Verification: Playwright overflow checks pass (dev build and Docker image)

## 3. Accessibility audit

- [x] 3.1 Route-change focus to `<h1>` (query-only changes excluded); single `<h1>` and landmarks per page
- [x] 3.2 Keyboard-only flows automated; results recorded in `docs/qa/accessibility-responsive-checklist.md` (no manual screen-reader pass; listed as a limitation)
- [x] 3.3 axe checks in component tests (jsdom) and E2E (both themes, with contrast); no critical/serious violations
- [x] 3.4 Verification: all `accessibility-responsiveness` scenarios pass
