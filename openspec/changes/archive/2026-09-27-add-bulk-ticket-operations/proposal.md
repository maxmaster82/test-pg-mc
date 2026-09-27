## Why

Changing the status of many tickets (e.g. opening sales for an event) one form at a time is the most tedious admin task in this domain. A bulk status update is also the one bonus that exercises hard frontend engineering: selection state across pagination, optimistic cache updates, rollback, partial failure and accessible feedback. It was chosen over several shallow bonuses (dark mode, CSV export) on purpose.

## What Changes

- Row selection in the tickets list (checkbox per row/card, "select all on this page", selection count), persisted across pagination and cleared when filters change.
- Bulk action bar with "Change status" (select target status) and "Clear selection".
- Mock endpoint `POST /api/tickets/bulk-status` returning per-item results; business rule producing deterministic partial failures.
- Optimistic update of every cached ticket list page and detail, with full rollback on request failure and per-item rollback on partial failure; final reconciliation via invalidation.
- Accessible live announcements of the outcome; failed tickets stay selected and are highlighted.
- Non-goals: bulk delete, bulk edit of other fields, "select all N matching the filter" across the server.

## Capabilities

### New Capabilities

- `bulk-ticket-operations`: selection, bulk status change, optimistic UI, rollback, partial failure feedback.

### Modified Capabilities

- None (the tickets list gains selection additively; existing list requirements are unchanged).

## Dependencies

- `add-ticket-management`. Implemented after `add-event-and-category-management` and before the accessibility and delivery changes so they audit and E2E-test it.

## Impact

- `src/modules/tickets/{bulk/*,queries.ts,pages/TicketsListPage.vue}`, `DataTable` selection support, `src/mocks/handlers/tickets.ts`.
