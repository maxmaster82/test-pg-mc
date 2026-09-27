## Context

First full vertical slice. Its patterns (query keys, list state, table, form, mutation feedback) become the template for Events and Categories, so they are designed for reuse but extracted only where the slice itself needs them.

## Goals / Non-Goals

**Goals:** correct URL-driven list behavior without race conditions; one form for create/edit with shared client/server validation; lists that never show stale data after mutations.
**Non-Goals:** generic `ResourcePage` component or config-driven CRUD; virtualized tables.

## Decisions

### API contract

| Method | Path                                                                | Notes                                                                                             |
| ------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| GET    | `/api/tickets?q&status&eventId&categoryId&sort&order&page&pageSize` | `sort ∈ {name, price, quantity, status, updatedAt}`, default `updatedAt desc`; `q` matches `name` |
| GET    | `/api/tickets/:id`                                                  | 404 `NOT_FOUND`                                                                                   |
| POST   | `/api/tickets`                                                      | body = `TicketInput`; 201 + ticket; 422 with `fieldErrors`                                        |
| PATCH  | `/api/tickets/:id`                                                  | body = `Partial<TicketInput> & { version }`; 409 `CONFLICT` if version mismatch                   |
| DELETE | `/api/tickets/:id`                                                  | 204                                                                                               |
| GET    | `/api/events`, `/api/categories`                                    | read-only lists (same list contract) used for filters/selects                                     |

List responses embed `event: { id, name }` and `category: { id, name }` summaries on each ticket, as a real API would, to avoid N+1 lookups in the table.

### Query keys and invalidation

Key factory per module: `ticketKeys.all = ['tickets']`, `.lists()`, `.list(params)`, `.detail(id)`. After create/update/delete: `setQueryData(detail)` with the response, then `invalidateQueries(ticketKeys.lists())`. List queries use `placeholderData: keepPreviousData` and pass `signal` to the repository, so superseded requests are aborted and never rendered. Form saves are pessimistic (wait for server validation); optimistic updates are reserved for bulk status changes.

### `useListQueryState(schema, defaults)`

Reads `route.query`, parses with a Zod schema using `.catch(default)` per field (invalid → default), exposes a reactive typed state and `update(patch, { resetPage })`. Writes use `router.replace` for search keystrokes and `router.push` for page/sort/filter changes (so Back works as expected without flooding history). Default values are omitted from the URL. The debounced search input keeps its own local ref and commits to the URL after 300ms.

### Forms

`TicketForm.vue` receives `initialValues` and emits `submit(payload)`; pages own the mutation. `schemas.ts` holds `ticketInputSchema` (API shape, minor units) and `ticketFormSchema` (decimal price string) plus `toFormValues`/`toPayload`. Server `fieldErrors` are mapped onto fields; focus moves to the first invalid field on submit. `onBeforeRouteLeave` guards dirty forms.

### DataTable

`DataTable<T>` props: `columns` (key, label, sortable, priority `high|medium|low`, cell slot), `rows`, `sort`, `loading`, `rowKey`; emits `sort`. Renders `<table>` with `<caption>` (visually hidden) and `aria-sort` at ≥768px, hides `low` priority columns at 768–1023px, and renders a `<ul>` of cards below 768px using `useMediaQuery` (render one variant, not both, to avoid duplicated DOM for assistive tech and tests). Selection is intentionally not included yet; it is added by the bulk-operations change when there is a real need.

### Money

Price input is a text field with `inputmode="decimal"`, parsed by `parseMoney` into minor units; display uses `formatMoney(minor, currency)`. Floating-point arithmetic on prices is avoided entirely.

## Risks / Trade-offs

- [Event combobox over a large dataset] → server-side search with debounce (`/api/events?q=...&pageSize=20`); selected value label comes from the ticket's embedded summary.
- [Table abstraction premature] → it is used by three lists in this project; API kept minimal and reviewed after Events/Categories.
- [Version conflicts are rare in a single-user demo] → testable deterministically via MSW override; it demonstrates the multi-admin strategy discussed in TECHNICAL_REVIEW.

## Validation plan

- Unit: `useListQueryState` parsing/serialization/fallbacks, money parse/format, schemas (boundaries: 2/120 chars, 0 and 100000.00, 3 decimals rejected), list handler behavior.
- Integration (Testing Library + MSW, per list scenario): search debounce and URL, stale response discarded (delayed handler), filter by status/event/category, sort toggle with `aria-sort`, pagination and page-size, last-page deletion, empty vs no-results, 500 + Retry.
- Integration CRUD: create (valid, invalid, server 422 field error, 500 keeps values), edit (prefill, save, 409 conflict), view (404), delete (confirm, cancel + focus return), list refresh after mutation.
- Responsive: DataTable card mode under mocked `matchMedia` (390px).
