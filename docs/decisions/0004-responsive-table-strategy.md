# ADR 0004 — Responsive data tables

- Status: Accepted (implemented; see notes below where the implementation differs from the proposal)
- Change: add-ticket-management

## Decision

`DataTable` renders a semantic `<table>` at ≥768px, hides columns marked `priority: 'low'` below 1280px (revised during implementation: at 1024px the persistent sidebar leaves too little room), and renders a list of cards below 768px. Exactly one variant is rendered (via `useMediaQuery`), and cells are slot-based so both variants share cell components.

## Alternatives

Horizontal scrolling tables (poor on phones; hides actions); rendering both variants and toggling with CSS (duplicated DOM for assistive technology and tests); CSS-only reflow of `<table>` into blocks (breaks table semantics).

## Consequences

Requires a `matchMedia` polyfill in tests and a JS breakpoint mirror of the CSS tokens.

## Implementation notes

- Card mode includes a "Sort by" select (headers are not available there) and the same row actions and selection checkboxes.
- The application shell's two-column grid is driven by the same JS media query as the sidebar; a CSS breakpoint there disagreed with the JS one at exactly 1024 px during the audit.
