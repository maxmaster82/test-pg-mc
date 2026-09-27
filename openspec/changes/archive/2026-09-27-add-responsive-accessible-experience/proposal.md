## Why

Responsive behavior and accessibility are built into each slice (shell drawer, DataTable card mode, accessible primitives), but they regress easily and are rarely verified end to end. This change defines explicit, cross-cutting acceptance criteria per breakpoint and interaction mode, adds a theme preference, and closes the gaps found in a dedicated audit.

## What Changes

- Breakpoint contract: mobile < 768px, tablet 768–1023px, desktop ≥ 1024px; verified at 320, 390, 768, 1024 and 1440px.
- Keyboard and focus audit of every page and dialog; fixes for gaps found.
- Form accessibility conventions verified: labels, `aria-describedby` for hints/errors, `aria-invalid`, focus to first invalid field, required indicators.
- `preferences` store: theme (`system` | `light` | `dark`) persisted and applied via `data-theme`; honor `prefers-reduced-motion`.
- Automated accessibility checks (axe) in component tests for key components and in E2E for key pages.
- Non-goals: full WCAG conformance certification, screen-reader testing beyond VoiceOver spot checks, RTL support.

## Capabilities

### New Capabilities

- `accessibility-responsiveness`: cross-cutting responsive and accessibility requirements.

### Modified Capabilities

- None.

## Dependencies

- `add-event-and-category-management`, `add-bulk-ticket-operations` (audits the complete UI).

## Impact

- Fixes across `src/shared/ui` and module pages; `src/app/stores/preferences.ts`; theme toggle in the user menu; axe test helpers.
