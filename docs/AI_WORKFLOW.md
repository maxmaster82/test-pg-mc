# AI-assisted development workflow

How an AI coding agent was used to plan, build and verify this project, and where human judgment decided. This is a decision and validation log, not a chat transcript.

## In short: what the assessment asks, and what was done

| The brief asks how you…      | What was done                                                                                                                                                                                                                                                                                                         | Evidence                                                                                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **provide context**          | A detailed kickoff prompt: role, a two-phase process with a hard approval gate, guardrails, and a definition of done. The PDF was treated as requirements to analyse, not as instructions. Persistent project context is kept in `AGENTS.md` and `openspec/config.yaml`, so every session starts from the same rules. | [kickoff prompt](ai/kickoff-prompt.md), [`AGENTS.md`](../AGENTS.md), [`openspec/config.yaml`](../openspec/config.yaml)                          |
| **define requirements**      | Phase 1 produced specifications and no code: a classified requirements matrix; 15 explicit assumptions; 7 OpenSpec changes with proposals, 87 GIVEN/WHEN/THEN scenarios, designs and 96 tasks; ADR drafts. The developer reviewed the plan and approved it before implementation started.                             | [traceability](REQUIREMENTS_TRACEABILITY.md), [specs](../openspec/specs/), [archived changes](../openspec/changes/archive/), [ADRs](decisions/) |
| **guide the implementation** | One change at a time, in dependency order, as vertical slices: implement → test → focused checks → diff review → tick tasks only with evidence → archive into the living specs. Shared abstractions were extracted only when a third module needed them.                                                              | the Phase 2 log below                                                                                                                           |
| **iterate on the output**    | Every proposal was accepted, changed or rejected with a recorded reason. Several of the AI's own assumptions turned out wrong and were corrected.                                                                                                                                                                     | [summary table](#summary-how-ai-was-used)                                                                                                       |
| **validate the results**     | Nothing counted as done on the AI's word: `pnpm verify` (format, lint, types, 218 tests with coverage thresholds, build, 13 E2E), real-browser checks, screenshots at five widths, axe in both themes, and the E2E suite run against the Docker image.                                                                | [QA checklist](qa/accessibility-responsive-checklist.md), CI                                                                                    |

## Context provided to the AI

- **The assessment PDF** (7 pages) as the source of requirements. It is not committed, because it is a third-party document; its requirements are paraphrased in the traceability matrix.
- **[The kickoff prompt](ai/kickoff-prompt.md), verbatim.** It sets the role, the two-phase gated process, the working rules (no commits or publishing without permission, record assumptions, no speculative abstractions, never mark a task done without verification), what each phase must deliver, and the review checklist.
- **Persistent repository context:**
  - [`AGENTS.md`](../AGENTS.md): architecture rules, conventions, quality gates and change order. `CLAUDE.md` is a one-line pointer to it for tools that read that file name.
  - `openspec/config.yaml`: project context and per-artifact rules, for example "every task group ends with a verification task" and "scenarios must be observable".

## Process

1. **Phase 1: discovery and specification, gated.** Requirements were extracted and classified, the repository inspected, OpenSpec initialized, and seven changes written (proposal, behavioral specs, design, tasks). ADRs were drafted as _Proposed_ and a traceability matrix was created. No application code was written.
2. **Developer review gate.** Phase 2 started only after explicit approval, with the developer choosing between the proposed options.
3. **Phase 2: implementation per change**, in dependency order. Each change got focused tests, a diff review, honest task updates, and an `openspec archive` once verified, which merges its specs into `openspec/specs/`.
4. **A skeptical review pass**, then documentation written from the actual implementation.

## Phase 1 log

### Discovery

- Repository was empty (not a git repo). Tooling found: Node 24.18, pnpm 11.10, npm 11.16, Docker 29.6, OpenSpec CLI 1.6.0. Yarn/bun not installed (yarn only via corepack download).
- The PDF could not be rendered by the agent's PDF reader (missing poppler); text was extracted with `unpdf` in a scratch directory outside the repo. All 7 pages were read.

### Decisions proposed by the AI (pending developer review)

- TanStack Query for server state (justified by URL-keyed lists, cancellation, cross-entity invalidation, optimistic rollback) — ADR 0001.
- MSW + seeded in-memory db, MSW kept in the Docker demo build — ADR 0002.
- Restrict (409) instead of cascade when deleting referenced events/categories.
- Integer minor units for money; optimistic concurrency via `version` field (409 on conflict).
- Bulk ticket status update with optimistic UI as the single showcase bonus.

### Weak assumptions caught during planning

- The brief's "Dashboard with search/filter/sort/pagination" was first read as a single combined screen; re-read as the admin portal whose entity lists provide these features, plus a light overview page. Recorded as assumption A1.
- Initial plan put all mock endpoints in the bootstrap change; revised so each slice owns its handlers (tickets adds read-only event/category lists it needs), keeping changes vertical and reviewable.
- A separate "responsive & accessible" change built last would imply bolting responsiveness on at the end; reframed as a cross-cutting audit with baseline responsiveness required inside every slice.
- Considered committing the assessment PDF as context; rejected — it is a third-party document and the repository will be public. Requirements are paraphrased in the traceability matrix instead.

### Validation run in Phase 1

- `openspec validate --all --strict` → 7 changes passed.

## Phase 2 log

**Approval.** On 2026-09-27 the developer approved Phase 1 in a short natural-language message (not the exact agreed phrase) and accepted both recommended defaults: TanStack Query for server state, and committing the OpenSpec tooling and the kickoff prompt as evidence. The agent treated this as approval and said so in its reply.

### Change 1 — bootstrap-frontend-architecture (archived)

- **Dependency check before install.** The latest major versions had moved (TypeScript 7, Vite 8, Vitest 5, Vue Router 5, Pinia 4). Peer ranges were checked first: typescript-eslint supports TypeScript <6.1, so TypeScript was pinned to 5.9 rather than taking `latest` blindly.
- **Weak assumption caught by a spike test.** The plan assumed VeeValidate works with Zod 4. A throwaway test showed that `validate()` returned `valid: true` for invalid input. That is a _silent_ failure, which would have shipped forms without validation. VeeValidate was removed, and the planned fallback, `useZodForm`, was implemented and unit-tested (ADR 0006).
- **Boundary kept honest.** The first idea for mock "developer settings" was a Pinia store read by the mock, which would have made the UI and the mock share state. It was replaced with `/api/__dev/*` endpoints consumed over HTTP, so the UI never imports mock code. An ESLint probe confirmed the `no-restricted-imports` rules fire.
- **Race in a proposed component.** The first `ConfirmHost` used Reka's `AlertDialogAction`, whose own close handler could resolve the promise as `false` before our `true`. It was replaced with a plain button that settles the result first.
- **Browser check found a UX gap.** Opening the Docker container in the browser showed a blank page when Service Worker registration failed. The cause was environmental, but a failed mock start should never leave a blank page, so `main.ts` now renders an explanatory message.
- **Validation:** lint, format, typecheck, 65 tests, build, `docker build`, and the smoke script (root, deep link, worker script, health, non-root uid 101) all passed. The shell and mock API were also checked in the browser.

### Change 2 — add-authentication-flow (archived)

- **Composition root extracted.** Auth wiring (HTTP token provider, 401 handler, guards) initially lived in `main.ts`, which integration tests could not reuse. It moved to `createAppContext()`, used by both `main.ts` and `renderApp()`, so tests exercise the real guards.
- **Accessibility bug caught by a test.** The toast container kept an always-present, empty `role="alert"` region. Testing Library found two alerts on the login page. The role was removed; `aria-live="assertive"` alone keeps announcements working without a permanent empty alert.
- **Interaction bug caught by a test.** Clearing the password after a failed login re-validated the touched field ("Password is required") and moved focus to it, stealing focus from the error alert. Fixed by resetting form state with the email kept.
- **Typing tightened.** `useZodForm.field()` returned `unknown` values; `vue-tsc` rejected them against `TextField`'s `string` model. The binding is now generic per field.
- **Validation:** 91 tests passing; lint and typecheck clean; manual browser check of failed login (alert focused, password cleared) and successful login.

### Change 3 — add-ticket-management (archived)

- **Robustness bug found in the browser.** After a hot reload the admin was unexpectedly signed out. Cause: `restoreSession()` treated _any_ `/auth/me` failure as an invalid session, so a transient 500 or network error would log users out. Now only a 401 clears the token; a test covers the transient case.
- **Layout finding from a screenshot.** At 1024px the sidebar plus seven columns overflowed. Low-priority columns are now hidden below 1280px instead of 1024px; the spec and ADR 0004 were updated before archiving.
- **Fixture finding from the combobox.** Server-side search showed two events with the same name: the seed generator repeated (prefix, kind) pairs. The generator was fixed, a uniqueness test added, and the storage key bumped so stale browser data is discarded.
- **Focus bug caught by a test.** Cancelling a delete opened from a row's actions menu returned focus to `<body>`, because the dialog opened while focus was still on the menu item being removed. `RowActions` now focuses its trigger before running the action, and `ConfirmHost` restores focus to the element that requested confirmation.
- **Tests corrected, not the app.** Three failures were test mistakes: not waiting for async options, expecting a default value to be written into the URL (canonical URLs omit defaults), and a helper that waited for a table on a "no results" page. They were fixed in the tests after confirming the app behavior was right.
- **Typing adjustment.** Form enum fields accept `string` input (what `<select>` produces) and narrow on validation, instead of casting in templates.
- **Deferred extraction.** Sort toggling, last-page clamping and delete-with-confirmation exist once per module so far. They are candidates to extract only if Events and Categories repeat them.
- **Validation:** 144 tests passing; lint, typecheck and format clean; manual browser checks of the list at 1024px, event search in the combobox, login persistence across reload.

### Change 4 — add-event-and-category-management (archived)

- **Extraction after proof, not before.** Once the third module needed them, four pieces were extracted: sort toggling and page clamping (`useListQueryState`), delete-with-confirmation including the 409 explanation (`useDeleteWithConfirm`), and edit-page behavior (`useEntityEditForm` plus `ConflictNotice`). A generic list/detail page component was considered and rejected: column and field differences make configuration heavier than the duplicated markup.
- **Validation UX gap found by a test.** Zod skips object-level refinements while any other field is invalid, so "end date before start date" only appeared once the whole form was valid. The refinement now uses `when:` to run as soon as both dates are valid.
- **Test-isolation bug.** The confirm dialog is an app-wide singleton. An unanswered dialog from one test reappeared in the next test's app, hiding the page from assistive technology and blocking clicks. The test setup now settles pending confirmations and clears Reka's body lock after each test.
- **Demo data credibility.** Browser checks showed events starting at 3:00 AM. The generator now schedules evening starts, and the storage key was bumped.
- **Deterministic dates.** Tests pin `TZ=Europe/Paris` and cover local↔UTC conversion across the October DST change.
- **Validation:** 178 tests passing; lint, typecheck and format clean; Overview counts and the Events country filter checked in the browser.

### Change 7 (bonus) — add-bulk-ticket-operations (archived)

- **Order changed on purpose.** The bonus was implemented before the accessibility audit and the delivery change, so both would cover it.
- **Rollback design.** The first version of the plan restored whole cache snapshots on partial failure. It was changed to revert only the refused tickets, so changes made to other tickets in the meantime are not overwritten. The transforms are pure functions with unit tests.
- **Focus in real browsers.** jsdom keeps focus on a button when it becomes `disabled`; browsers move it to `<body>`. This was checked in the real browser and handled explicitly: the bulk bar returns focus to Apply, and `useZodForm` returns focus to the submit button after a failed save.
- **Validation:** 199 tests passing (21 of them for bulk). In the browser: optimistic statuses visible before the response, `aria-busy` on the table, a partial-failure message, only the refused ticket left selected, and focus back on Apply.

### Change 5 — add-responsive-accessible-experience (archived)

- **Real-browser audit, not just tests.** The agent measured document and table overflow on 11 pages at 320, 390, 768, 1024 and 1440 px.
  - **Found:** at exactly 1024 px the CSS grid (`lg:`) and the JS sidebar breakpoint disagreed, squeezing all content into the 240 px sidebar column. **Fix:** the grid is driven by the same JS flag. A unit test and the Playwright overflow sweep now guard it.
- **A misleading signal, investigated rather than "fixed".** With the browser pane hidden, media-query `change` events were not delivered, so the layout looked broken at 390 px. A reload proved this was an environment artifact. Playwright, with real rendering, confirmed the correct behavior. No code was changed for it.
- **Touch targets.** Card title links were 19 px tall and were enlarged. The spec target was also corrected from "44 px for all targets" to the WCAG 2.5.8 minimum of 24 px, with primary controls at 44 px. That is a deliberate spec correction, recorded here.
- **Test infrastructure bug.** The `matchMedia` polyfill called listeners without an event object. It only surfaced when a long-lived store (the theme preference) subscribed. The polyfill now dispatches proper change events.
- **Accessible naming.** The Demo button had two responsive labels that concatenated without CSS. It now uses a single `aria-label` that contains the visible text (WCAG 2.5.3).
- **Not done:** a manual screen-reader pass. It is listed as a limitation in the QA checklist and the technical review.

### Change 6 — add-testing-quality-and-delivery

- **Playwright on the production build.** 13 tests across desktop and mobile projects. The first run had one failure caused by a test mistake: the "first option" locator matched a hidden `<option>` of a native select instead of the combobox list. The screenshot showed the UI was fine, so the locator was scoped instead of changing the app.
- **Screenshots reviewed.** Captures at 390, 768, 1440 px and in dark mode were read and reviewed. A blank dark-mode capture was traced to taking the screenshot before the page had loaded.
- **The same E2E suite ran against the Docker image** (`E2E_BASE_URL`, realistic 250–600 ms mock latency): 13/13 passed once the overflow sweep was given a longer timeout (40 full page loads).
- **Coverage thresholds** were set from measured numbers, then verified to fail the command by temporarily raising the global threshold to 99%.
- **Flakiness removed.** The "superseded search" test used fixed sleeps. It now gates the slow response with promises and passed 3/3 in isolation. The whole E2E suite passed on two consecutive runs.

### Skeptical review pass (after all changes)

Checked: duplicated logic, leaky abstractions, cache invalidation, stale UI after mutations, list race conditions, loading/error states, reference integrity, dialog accessibility, destructive actions without confirmation, flaky tests, mobile overflow, Docker runtime, and whether the documentation matches the code.

- **Fixed:** an empty filtered result on a high page number stayed on that page. `keepPageInBounds` now also returns to page 1.
- **Fixed:** create-page submit logic appeared three times and was extracted into `useEntityCreateForm`, matching `useEntityEditForm`.
- **Verified, no change:** the invalidation matrix covers every write, including Overview totals and picker options. Destructive actions (delete, reset demo data) always confirm. The mock chunk contains only MSW's runtime and is lazy-loaded.
- **Accepted and documented:** broad `tickets.*` invalidation, seven Overview requests, the size of the tickets list page, and the per-entity page templates (see TECHNICAL_REVIEW §3–4).

## Summary: how AI was used

|                                           | Examples                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Proposed by AI and accepted**           | Domain-module structure with lint-enforced boundaries; TanStack Query for server state; MSW with a seeded in-memory DB and shared Zod schemas; URL-as-state list composable; restrict-not-cascade deletes; `version`-based optimistic concurrency; bulk status update as the single bonus                                             |
| **Proposed and then rejected or changed** | VeeValidate (failed spike); a Pinia store for mock settings (replaced by `/api/__dev`); all mock endpoints in bootstrap (moved into each slice); whole-snapshot rollback on partial failure (per-ticket instead); a CSS-driven shell grid (JS-driven); a generic config-driven CRUD page (not built)                                  |
| **Caught by verification**                | Silent validation pass; logout on transient errors; duplicate seed names and 3 AM events; the 1024 px layout collapse; focus lost to `<body>` (dialogs from menus, disabled busy buttons); an empty `role="alert"` region; Zod refinements skipped while other fields are invalid; test-isolation leaks (singleton dialog, body lock) |
| **Human decisions**                       | The Phase 1 approval gate and its two defaults; permission boundaries (no commits, pushes or publishing without explicit approval)                                                                                                                                                                                                    |

**Validation commands run (final state):** `pnpm install --frozen-lockfile` from a clean `node_modules`; `pnpm verify` (format, lint, typecheck, 218 tests with coverage, build, 13 E2E): exit 0. Also `./scripts/docker-smoke.sh` (passed), `docker compose up --build` (healthy), `E2E_BASE_URL=http://localhost:8080 pnpm test:e2e` (13/13), and `openspec validate --all --strict`.
