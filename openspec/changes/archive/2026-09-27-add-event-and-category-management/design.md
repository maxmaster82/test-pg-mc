## Context

Second and third vertical slices. They reuse the ticket slice's building blocks and are the evidence for (or against) further shared abstractions.

## Goals / Non-Goals

**Goals:** complete CRUD for both entities; safe relationship rules; no stale ticket data after event/category changes.
**Non-Goals:** cascade delete, reassigning tickets in bulk from the delete dialog (noted as a future improvement).

## Decisions

- **Restrict, don't cascade.** Deleting a referenced event/category returns 409 with `details: { ticketCount }`. Cascade was rejected: silently deleting sellable inventory is a destructive side effect an admin would not expect. Soft delete/archival is noted as the production direction (events already have `cancelled`/`completed` statuses).
- **Ticket counts** are computed by the mock API and returned on list and detail responses (`ticketCount`), as a real API would aggregate them.
- **Invalidation matrix.**
  | Mutation                      | Invalidates                                                                           |
  | ----------------------------- | ------------------------------------------------------------------------------------- |
  | event create/update/delete    | `events.lists`, `events.detail(id)`, `tickets.all` (names embedded, filters' options) |
  | category create/update/delete | `categories.*`, `tickets.all`                                                         |
  | ticket create/update/delete   | `tickets.*`, `events.all`, `categories.all` (ticket counts)                           |
- **Dates.** Event form uses `<input type="datetime-local">`; values converted local ↔ ISO UTC in `schemas.ts` with unit tests across a DST boundary. Display uses `Intl.DateTimeFormat` with date and time.
- **Countries.** A static list of ISO codes; labels from `Intl.DisplayNames(['en'], { type: 'region' })`, sorted by label.
- **Extraction after proof.** After both slices exist, compare the three modules; extract only what is identical (expected: mutation feedback helper that maps `ApiError` to toasts/field errors, `EntityPageHeader`, delete-with-confirm composable). Rejected up front: a config-driven `ResourceCrudPage`.

## Risks / Trade-offs

- [Broad invalidation of `tickets.all` refetches active ticket queries] → acceptable at this scale; noted in TECHNICAL_REVIEW with targeted invalidation/normalized cache as scaling options.
- [Time zone bugs in event dates] → conversion isolated in two tested functions.

## Validation plan

- Unit: event schema (end ≥ start, DST conversion), category schema, country options.
- Handler tests: 409 on referenced delete with count, 422 duplicate category name, ticket counts.
- Integration: full CRUD for both entities; referenced delete message + link; rename propagates to tickets list (cache invalidation); new category appears in ticket form select.
- Review: document the extraction decisions in `docs/AI_WORKFLOW.md`.
