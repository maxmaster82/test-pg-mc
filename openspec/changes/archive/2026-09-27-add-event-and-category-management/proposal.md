## Why

The assessment requires full CRUD for Events and Categories as well. They also introduce the key data-integrity question: what happens to tickets when a referenced event or category is deleted or renamed.

## What Changes

- Event and Category models, schemas, repositories, query composables, write endpoints in the mock API.
- List/detail/create/edit/delete pages for both, reusing `DataTable`, `useListQueryState`, `ConfirmDialog` and the form patterns from tickets.
- Referential integrity: deleting an event or category that still has tickets is refused (409) with the ticket count and a link to the filtered ticket list.
- Cross-entity cache invalidation: updating an event or category name invalidates ticket queries (tickets embed their names).
- Event detail page shows the event's tickets (filtered list link + count); category detail shows ticket count.
- Post-slice review: extract duplication proven across the three modules (e.g. `useCrudMutationFeedback`, `EntityFormLayout`) only where it is identical in all three.
- Non-goals: cascade delete, event scheduling calendar, venue management.

## Capabilities

### New Capabilities

- `event-management`: event model, validation, CRUD flows and delete rules.
- `category-management`: category model, validation (unique names), CRUD flows and delete rules.

### Modified Capabilities

- None.

## Dependencies

- `add-ticket-management` (shared list/table/form patterns, read-only event/category endpoints).

## Impact

- `src/modules/events/*`, `src/modules/categories/*`, `src/mocks/handlers/{events,categories}.ts`, ticket query invalidation.
