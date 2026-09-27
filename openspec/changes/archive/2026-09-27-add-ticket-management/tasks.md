## 1. Domain and mock API

- [x] 1.1 `modules/tickets/types.ts` and `schemas.ts` (input, update, form, mapping helpers); schema unit tests
- [x] 1.2 Mock handlers for tickets (list with embedded summaries, get, create, patch with version check, delete) using shared schemas; read-only events/categories list + get handlers with `ticketCount`
- [x] 1.3 Verification: handler tests (list contract, filters, 404, 422 field errors, 409 conflict, invalid reference, auth, simulated failure)

## 2. Data access

- [x] 2.1 `modules/tickets/api.ts` repository; read-only `events/api.ts` and `categories/api.ts`; lookups (`useEventOptions` server search, `useEventName`, `useCategoryOptions`)
- [x] 2.2 `keys.ts` + `queries.ts`: key factories, `useTicketsList`, `useTicket`, `useCreateTicket`, `useUpdateTicket`, `useDeleteTicket` with invalidation of ticket lists and event/category aggregates
- [x] 2.3 Verification: integration tests assert the list shows new/changed/deleted tickets without manual refresh

## 3. Shared list building blocks

- [x] 3.1 `useMediaQuery`-based breakpoints (vueuse), `SearchInput` (300 ms debounce), `useListQueryState` (Zod-validated URL state, canonicalization)
- [x] 3.2 `DataTable` (table + card modes, column priorities, `aria-sort`, mobile sort select, busy state), `ListPagination`, `SearchInput`, `RowActions`, `AsyncCombobox`
- [x] 3.3 Verification: behavior covered through list integration tests (sorting headers, card mode, pagination controls)

## 4. Pages

- [x] 4.1 Tickets list page (search, status/event/category filters, sort, pagination, empty/no-results/error states, row actions)
- [x] 4.2 Ticket detail page (not-found state, links to event/category)
- [x] 4.3 Create/Edit pages with shared `TicketForm` (field errors, focus first invalid, dirty-leave guard, 409 handling with "Load latest version")
- [x] 4.4 Delete via confirmation from list and detail; last-page adjustment
- [x] 4.5 Verification: integration tests for every `resource-listing` and `ticket-management` scenario pass (`tickets-list.spec.ts`, `tickets-crud.spec.ts`)

## 5. Review

- [x] 5.1 Review the diff for leaked abstractions and duplicated logic; corrections recorded in `docs/AI_WORKFLOW.md`. Candidates deferred to change 4 (extract only if repeated): sort toggling, last-page clamping, delete-with-confirmation.
