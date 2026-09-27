## 1. Events

- [x] 1.1 Types, schemas (local↔UTC date conversion, end ≥ start), country options; unit tests incl. DST boundary (TZ pinned to Europe/Paris in tests)
- [x] 1.2 Mock handlers: create/get/patch/delete with 409 restriction and `ticketCount`; handler tests
- [x] 1.3 Repository and query composables with the invalidation matrix (event writes invalidate `events.*` and `tickets.*`)
- [x] 1.4 Pages: list (search name/venue, status/country filters, sort), detail (ticket count + link), create/edit form, delete with integrity message
- [x] 1.5 Verification: `event-management` scenarios covered by integration tests (`events-flows.spec.ts`)

## 2. Categories

- [x] 2.1 Types and schemas; length rules covered by handler tests
- [x] 2.2 Mock handlers with case-insensitive unique-name 422 and 409 restriction; handler tests
- [x] 2.3 Repository and query composables with the invalidation matrix
- [x] 2.4 Pages: list, detail, create/edit form, delete with integrity message
- [x] 2.5 Verification: `category-management` scenarios covered by integration tests (`categories-flows.spec.ts`)

## 3. Consolidation

- [x] 3.1 Extracted only what was repeated across the three modules: `useListQueryState.sortBy/keepPageInBounds`, `useDeleteWithConfirm` (incl. 409 explanation), `useEntityEditForm` + `ConflictNotice`; ticket pages refactored onto them. Not extracted: list/detail page templates (column/field differences outweigh the shared markup)
- [x] 3.2 Overview page: entity counts and tickets-by-status summary with links (from list `meta.total` queries; no new endpoint)
- [x] 3.3 Verification: full suite (178 tests), lint, typecheck and format pass; extraction decisions logged
