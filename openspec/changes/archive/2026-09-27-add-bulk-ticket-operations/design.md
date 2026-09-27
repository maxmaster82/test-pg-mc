## Context

Showcase bonus. The hard parts are cache consistency across many cached list pages, correct rollback under partial failure, and not corrupting concurrent state.

## Goals / Non-Goals

**Goals:** instant feedback; exact rollback; honest partial-failure reporting; deterministic tests.
**Non-Goals:** server-side "select all matching" (would need a filter-based bulk endpoint; noted as scaling path), undo.

## Decisions

- **Selection state** lives in a page-scoped composable `useTicketSelection()` (a `Map<id, TicketSummary>`), not Pinia: it is ephemeral UI state tied to one page instance. Keeping summaries (not just ids) lets the bar describe selected items that are on other pages.
- **Optimistic mutation** with TanStack Query `useMutation`:
  - `onMutate`: `cancelQueries(ticketKeys.all)`; snapshot via `getQueriesData(ticketKeys.lists())` and affected details; `setQueriesData` to apply the new status to matching ids; return the snapshot.
  - `onError` (request failed): restore every snapshot.
  - `onSuccess` with `failed.length > 0`: patch only the failed ids back to their snapshot status (not restore whole snapshots, which could clobber unrelated concurrent changes); write `updated` items from the response.
  - `onSettled`: `invalidateQueries(ticketKeys.all)` and `events`/`categories` counts are unaffected (status only), so they are not invalidated.
- **Concurrency.** While a bulk mutation is pending, the bulk action is disabled; list refetches are cancelled in `onMutate` to prevent a stale response overwriting the optimistic state.
- **After a full success the selection is kept** (so another status can be applied); after a partial failure only refused tickets stay selected. The bulk bar therefore stays mounted and focus can be returned to its Apply button, which browsers drop to `<body>` while the busy button is disabled.
- **Partial-failure rule** is a real business rule (`OUT_OF_STOCK`), so tests are deterministic without random failure injection.
- **DataTable selection** is added as an optional capability (`selectable`, `selectedKeys`, `@toggle`, `@toggle-page`) now that there is a concrete consumer.

## Risks / Trade-offs

- [Filtered lists may briefly show items that no longer match the status filter after an optimistic change] → accepted; reconciled by invalidation in `onSettled`. Documented in ADR 0005.
- [Snapshot memory with many cached pages] → bounded by the query cache `gcTime`.

## Validation plan

- Unit: selection composable (toggle, page toggle, mixed state, clear on filter change); optimistic cache transform and partial rollback functions (pure, tested directly).
- Integration (MSW with controllable delay): optimistic display before response, total failure rollback, partial failure with message and remaining selection, limit of 100, keyboard-only flow, live-region text.
- E2E: bulk status change happy path.
