## Why

Tickets are the core entity and the most demanding list (search, three filters, sorting, pagination, relations to events and categories). Building this vertical slice first proves the list, form and mutation patterns before they are reused for Events and Categories.

## What Changes

- Ticket domain model, Zod schemas, repository (`modules/tickets/api.ts`) and query/mutation composables with a query-key factory.
- Mock handlers: `GET/POST /api/tickets`, `GET/PATCH/DELETE /api/tickets/:id`; read-only `GET /api/events` and `GET /api/categories` list endpoints needed for selects and filters (write endpoints come in the next change).
- `useListQueryState`: URL-synchronized, schema-validated list state (search, filters, sort, page, pageSize).
- Reusable `DataTable` (sortable headers, row actions, loading skeleton, empty and error states, stacked card layout below 768px), `Pagination`, `SearchInput`, `FilterBar`.
- Pages: Tickets list, Ticket detail, Create, Edit; delete with confirmation.
- Optimistic-concurrency guard: updates send the `version` the form was loaded with; 409 on mismatch.
- Non-goals: bulk actions (separate change), CSV import/export, infinite scroll.

## Capabilities

### New Capabilities

- `resource-listing`: shared, observable list behavior (URL state, debounced search, sorting, pagination, loading/empty/error states) reused by all entities.
- `ticket-management`: ticket model, validation rules and CRUD flows.

### Modified Capabilities

- None.

## Dependencies

- `bootstrap-frontend-architecture`, `add-authentication-flow`.

## Impact

- `src/modules/tickets/*`, read-only parts of `src/modules/events/api.ts` and `src/modules/categories/api.ts`, `src/shared/ui/{DataTable,Pagination,SearchInput,FilterBar}`, `src/shared/composables/useListQueryState.ts`, `src/mocks/handlers/{tickets,events,categories}.ts`.
