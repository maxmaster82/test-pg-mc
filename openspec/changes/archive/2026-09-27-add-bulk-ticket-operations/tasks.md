## 1. API

- [x] 1.1 `POST /api/tickets/bulk-status` handler with validation (1–100 ids), `OUT_OF_STOCK` rule, `NOT_FOUND`, per-item results; handler tests
- [x] 1.2 Repository function `ticketsApi.bulkUpdateStatus`

## 2. Selection

- [x] 2.1 `useTicketSelection` composable with unit tests
- [x] 2.2 DataTable selection slots (row/card checkboxes with accessible labels, header checkbox with mixed state via `AppCheckbox`)
- [x] 2.3 Verification: selection behavior covered by unit and integration tests

## 3. Optimistic mutation

- [x] 3.1 Pure helpers `applyStatus`, `collectStatuses`, `revertStatuses`, `mergeTickets`; unit tests
- [x] 3.2 `useBulkUpdateTicketStatus` mutation (onMutate/onError/onSuccess/onSettled per design)
- [x] 3.3 Bulk action bar UI, busy state (`aria-busy`), announcements (toasts + selection-cleared status), failed-row markers, focus restoration

## 4. Verification

- [x] 4.1 Integration tests for every `bulk-ticket-operations` scenario pass (`bulk-flow.spec.ts`); manual browser check of optimistic update, partial failure and focus
- [x] 4.2 ADR `0005-optimistic-updates-and-rollback.md` finalized to match implementation
