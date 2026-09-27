# ADR 0001 — Server state with TanStack Query; Pinia for client state only

- Status: Accepted (implemented; see notes below where the implementation differs from the proposal)
- Change: bootstrap-frontend-architecture

## Context

Lists are driven by URL parameters, change quickly while typing, and must stay consistent after mutations on related entities. A bulk optimistic update needs snapshot and rollback.

## Decision

Use `@tanstack/vue-query` for all server data (query key factories per module, `keepPreviousData` for lists, `AbortSignal` passthrough, invalidation after mutations). Use Pinia only for auth session, preferences, notifications and mock developer settings.

## Alternatives

- Pinia stores per resource: re-implements caching, deduplication, cancellation, staleness — more code and more race-condition risk.
- Pinia Colada: Vue-native and lighter; viable, but less mature and smaller ecosystem at time of writing.

## Consequences

One extra dependency and a learning curve for query keys/invalidation, in exchange for eliminating a class of stale-data and race bugs.

## Implementation notes

- Key factories live in each module's `keys.ts` (so modules can invalidate each other without circular imports); query/mutation composables in `queries.ts`.
- Invalidation matrix: ticket writes → `tickets.lists`, `events.*`, `categories.*` (ticket counts); event/category writes → their own keys + `tickets.*` (embedded names). The Overview reuses list keys, so it is covered automatically.
- Defaults (`app/providers/query-client.ts`): `staleTime` 30 s, one retry for network/5xx only, no retry for 4xx or mutations.
