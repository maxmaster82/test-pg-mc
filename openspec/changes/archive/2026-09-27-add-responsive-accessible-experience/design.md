## Context

By this point all features exist. This change is primarily an audit with a clear checklist, plus the small theme preference, rather than new product behavior.

## Goals / Non-Goals

**Goals:** measurable responsive and a11y criteria; automated regression checks; fixes for anything found.
**Non-Goals:** redesign; bespoke animation system.

## Decisions

- **Breakpoints as tokens** (`--bp-md: 768px`, `--bp-lg: 1024px`) mirrored in `useMediaQuery` constants so CSS and JS agree.
- **Focus on route change**: router `afterEach` focuses the page `<h1>` (`tabindex="-1"`) — preferred over focusing the main region because it announces the page name.
- **Theme** applied by an inline script in `index.html` reading `localStorage` before the app bundle loads (prevents flash); the Pinia `preferences` store owns updates afterwards.
- **Automated checks**: `vitest-axe` in component tests for shared UI; `@axe-core/playwright` in E2E for full pages (color contrast needs real rendering, so it is only meaningful in the browser).
- **Manual audit checklist** stored in `docs/qa/accessibility-responsive-checklist.md`, with results recorded after the pass.

## Risks / Trade-offs

- [axe cannot catch everything] → paired with the manual keyboard checklist and VoiceOver spot checks.
- [Card layout duplicates cell rendering logic] → cells are slot-based so both modes share the same cell components.

## Validation plan

- Playwright: overflow check at 5 widths on key pages; axe on key pages in both themes; mobile filters disclosure.
- Component tests: dialog focus trap/restore, menu arrow keys, route focus to `<h1>`, theme store persistence.
- Manual: keyboard-only CRUD run and VoiceOver spot check of login, list and delete dialog; findings recorded in the checklist.
