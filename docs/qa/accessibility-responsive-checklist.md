# Accessibility & responsive QA checklist

Results of the audit in change `add-responsive-accessible-experience` (2026-09-27). "Automated" means covered by a test that runs in `pnpm verify`.

## Responsive

| Check                                                                                                 | Result         | Evidence                                                                         |
| ----------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| No horizontal page overflow at 320 / 390 / 768 / 1024 / 1440 px on overview, lists, details and forms | Pass           | Automated: `e2e/responsive-a11y.spec.ts` (also run against the Docker image)     |
| Tables fit without internal scrolling at 768 / 1024 / 1440 px                                         | Pass           | Manual measurement in the browser (table wrapper scrollWidth = clientWidth)      |
| Mobile (<768 px): cards instead of tables, sort menu, filters collapsed behind "Filters (n)"          | Pass           | Automated: `tickets-list.spec.ts`, `accessibility.spec.ts`, `e2e/mobile.spec.ts` |
| Tablet/desktop: low-priority columns hidden below 1280 px                                             | Pass           | Screenshots at 768 / 1024 / 1440 px reviewed                                     |
| Navigation drawer below 1024 px; persistent sidebar at ≥1024 px                                       | Pass           | Automated: `app-shell.spec.ts`, `e2e/mobile.spec.ts`                             |
| Touch targets ≥ 24 px (WCAG 2.5.8); most controls 36–44 px                                            | Pass after fix | Card title links enlarged from 19 px to ~31 px                                   |

**Found and fixed:** at exactly 1024 px the CSS breakpoint (grid) and the JS breakpoint (sidebar) disagreed, which squeezed the content into the 240 px sidebar column. The grid is now driven by the same JS flag.

## Keyboard and focus

| Check                                                                                                    | Result         | Evidence                                                                     |
| -------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| Skip link moves focus to main content                                                                    | Pass           | Automated: `app-shell.spec.ts`                                               |
| Route change focuses the new page `<h1>`; filter/sort/page changes keep focus in place                   | Pass           | Automated: `accessibility.spec.ts`                                           |
| Dialogs trap focus, close on Escape, return focus to the trigger (including when opened from a row menu) | Pass after fix | Automated: `tickets-list.spec.ts`, `app-shell.spec.ts`, `e2e/events.spec.ts` |
| Destructive confirmations focus "Cancel" first                                                           | Pass           | Automated: `feedback.spec.ts`, `e2e/tickets.spec.ts`                         |
| Full create → delete flow without a pointer                                                              | Pass           | Automated: `e2e/events.spec.ts` (keyboard-only category flow)                |
| Bulk update by keyboard keeps focus in the bulk bar after the busy state                                 | Pass after fix | Automated: `bulk-flow.spec.ts`, `e2e/tickets.spec.ts` (real browser)         |
| Forms: submit moves focus to the first invalid field; a failed save returns focus to the submit button   | Pass           | Automated: `tickets-crud.spec.ts`, `login-flow.spec.ts`                      |

## Semantics and announcements

| Check                                                                                            | Result | Evidence                                                          |
| ------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------- |
| Exactly one `<h1>` per page; `main` and `nav` landmarks                                          | Pass   | Automated: `accessibility.spec.ts`; manual count on 11 pages      |
| Sortable headers expose `aria-sort`                                                              | Pass   | Automated                                                         |
| Form fields: labels, `aria-invalid`, `aria-describedby` for hints and errors, required indicator | Pass   | Automated: `login-flow.spec.ts`, `tickets-crud.spec.ts`           |
| Toasts announced (polite for success, assertive for errors) without stealing focus               | Pass   | Automated: `feedback.spec.ts`                                     |
| Status conveyed by text (badges have text labels, not colour only)                               | Pass   | Review                                                            |
| axe: no critical/serious violations on key pages (jsdom, without contrast)                       | Pass   | Automated: `accessibility.spec.ts`                                |
| axe incl. colour contrast in light and dark themes (real browser)                                | Pass   | Automated: `e2e/responsive-a11y.spec.ts`                          |
| `prefers-reduced-motion` disables animations                                                     | Pass   | CSS rule in `main.css`; drawer animation uses `motion-safe:`      |
| Theme: System / Light / Dark, persisted, applied before first paint                              | Pass   | Automated: `accessibility.spec.ts`, `e2e/responsive-a11y.spec.ts` |

## Not done (known limitations)

- No manual screen-reader pass (VoiceOver/NVDA) was performed in this session; checks rely on axe, semantics tests and keyboard tests.
- No RTL layout support.
