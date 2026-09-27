# mock-api Specification

## Purpose
TBD - created by archiving change bootstrap-frontend-architecture. Update Purpose after archive.
## Requirements
### Requirement: Remote-like REST contract

The mock API SHALL be served over HTTP under `/api` by request interception (MSW) and SHALL be the only way the UI reads or writes data. UI code MUST NOT import fixtures or the in-memory database.

#### Scenario: UI isolation

- **WHEN** the source tree is linted
- **THEN** an import restriction rule reports any import of `src/mocks/**` from `src/app`, `src/modules` or `src/shared`

### Requirement: List query contract

Every collection endpoint SHALL accept `page` (1-based, default 1), `pageSize` (one of 10, 20, 50; default 20), `q` (case-insensitive substring search), `sort` (whitelisted field), `order` (`asc`|`desc`) and resource-specific filters, and SHALL respond with `{ data: T[], meta: { page, pageSize, total, totalPages } }`.

#### Scenario: Paginated response

- **GIVEN** 250 tickets exist
- **WHEN** the client requests `GET /api/tickets?page=2&pageSize=20`
- **THEN** the response contains 20 items and `meta` equals `{ page: 2, pageSize: 20, total: 250, totalPages: 13 }`

#### Scenario: Invalid query values fall back to defaults

- **WHEN** the client requests `?page=-3&pageSize=999&sort=unknown`
- **THEN** the API responds 200 using `page=1`, `pageSize=20` and the resource's default sort

#### Scenario: Page beyond range

- **GIVEN** 25 matching items and `pageSize=20`
- **WHEN** the client requests `page=5`
- **THEN** the API responds 200 with an empty `data` array and `meta.totalPages` of 2

#### Scenario: Stable ordering

- **WHEN** two items have equal values for the sort field
- **THEN** they are ordered by `id` ascending so pagination never duplicates or skips items

### Requirement: Error envelope

Error responses SHALL use `{ error: { code, message, fieldErrors? } }` with codes `VALIDATION_ERROR` (422), `NOT_FOUND` (404), `CONFLICT` (409), `UNAUTHORIZED` (401) and `INTERNAL_ERROR` (500).

#### Scenario: Validation failure

- **WHEN** a create request violates a schema constraint
- **THEN** the API responds 422 with `fieldErrors` keyed by field name

### Requirement: Deterministic fixtures

The mock database SHALL be seeded from a fixed-seed generator producing the same data on every run: 8 categories, 24 events and 250 tickets with valid references.

#### Scenario: Reproducible seed

- **WHEN** the database is reset twice
- **THEN** both resets produce deep-equal data

### Requirement: Simulated network conditions

The mock API SHALL add configurable latency (default 250–600ms in the browser, 0ms in tests) and SHALL support failure injection for demonstration and testing.

#### Scenario: Forced failure

- **GIVEN** failure simulation is set to "always fail" from the developer settings menu
- **WHEN** any `/api` request except authentication is made
- **THEN** the API responds 500 with `INTERNAL_ERROR`

### Requirement: Demo data persistence

In the browser, the mock database SHALL persist mutations to `localStorage` and SHALL offer a "Reset demo data" action restoring the seed. Tests MUST use a fresh in-memory database per test.

#### Scenario: Reload keeps changes

- **GIVEN** the user created a category
- **WHEN** the page is reloaded
- **THEN** the category still appears in the list

#### Scenario: Reset

- **WHEN** the user confirms "Reset demo data"
- **THEN** the seed data is restored and all cached queries are refetched

