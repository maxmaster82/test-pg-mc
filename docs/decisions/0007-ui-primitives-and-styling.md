# ADR 0007 — Reka UI primitives + Tailwind CSS tokens

- Status: Accepted (implemented; see notes below where the implementation differs from the proposal)
- Change: bootstrap-frontend-architecture

## Decision

Use Reka UI headless primitives for behavior-heavy widgets (Dialog, AlertDialog, DropdownMenu, Select, Combobox, Toast) wrapped in our own `shared/ui` components, styled with Tailwind CSS v4 over CSS custom-property design tokens (light/dark).

## Alternatives

Full component libraries (PrimeVue, Vuetify): heavier, harder to theme consistently, and they hide component design. Hand-rolled primitives: high accessibility risk.

## Consequences

Accessible behavior out of the box; visual layer fully owned and consistent.

## Implementation notes

- Reka UI is used for Dialog (navigation drawer), AlertDialog (confirmations), DropdownMenu (row actions, user and demo menus) and Combobox (server-searched event picker).
- Toasts are an in-house `ToastRegion` with permanent polite/assertive live regions (explicit control over announcements, pause on hover/focus).
- Plain native `<select>` elements are used for short option lists (better mobile UX and accessibility than a custom listbox).
- Tokens are defined with Tailwind v4 `@theme` in `app/styles/main.css`; dark mode overrides the same variables under `[data-theme='dark']`. axe colour-contrast checks pass in both themes.
