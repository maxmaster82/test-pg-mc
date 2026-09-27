# ADR 0005 — Optimistic updates only for bulk status changes

- Status: Accepted
- Change: add-bulk-ticket-operations
- Code: `src/modules/tickets/bulk/`

## Context

Administrators often change the status of many tickets at once (e.g. opening sales for an event). The change is low-risk, easy to reconcile, and benefits from instant feedback. Create/edit forms are different: the server can reject them (validation, conflicts), and showing unconfirmed data there would mislead.

## Decision

- Create/edit/delete are **pessimistic**: wait for the server, then update caches and invalidate.
- Bulk status change is **optimistic** (`useBulkUpdateTicketStatus`):
  1. `onMutate`: cancel in-flight ticket queries, snapshot every cached ticket list page and detail, record the previous status of each selected ticket, apply the new status everywhere.
  2. `onError` (request failed): restore every snapshot.
  3. `onSuccess` with failures: revert **only** the refused tickets to their recorded status (not whole snapshots, which could overwrite unrelated concurrent changes) and merge the server's authoritative copies of updated tickets.
  4. `onSettled`: invalidate `tickets.*` to reconcile filtered lists and totals.
- The transforms are pure functions (`bulk/cache.ts`) with unit tests; the flow is covered by integration tests with a gated request.
- Partial failures come from a real business rule (a ticket with quantity 0 cannot go on sale), which keeps tests deterministic.

## Alternatives

- Pessimistic bulk update with a spinner: simpler, slower perceived UX.
- Full snapshot restore on partial failure: simpler, but can clobber changes made meanwhile.
- Selection in Pinia: rejected; it is ephemeral state owned by one list page.

## Consequences

- Filtered lists may briefly show rows that no longer match the filter until `onSettled` refetches.
- A bulk action is limited to 100 tickets (client and server). "Select all N matching the filter" would need a filter-based server endpoint (see TECHNICAL_REVIEW).
