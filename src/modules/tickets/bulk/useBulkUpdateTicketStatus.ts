import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ticketsApi } from '../api'
import { ticketKeys } from '../keys'
import type { BulkStatusInput } from '../schemas'
import type { Ticket, TicketStatus } from '../types'
import {
  applyStatus,
  collectStatuses,
  mergeTickets,
  revertStatuses,
  type CachedTickets,
} from './cache'

interface Context {
  snapshot: [readonly unknown[], CachedTickets][]
  previous: Map<string, TicketStatus>
}

/** Optimistic bulk status change with full rollback on failure and per-ticket rollback on partial failure. */
export function useBulkUpdateTicketStatus() {
  const queryClient = useQueryClient()
  const allTickets = { queryKey: ticketKeys.all }

  return useMutation({
    mutationFn: (input: BulkStatusInput) => ticketsApi.bulkUpdateStatus(input),

    onMutate: async ({ ids, status }): Promise<Context> => {
      // Stop in-flight fetches so a stale response cannot overwrite the optimistic state.
      await queryClient.cancelQueries(allTickets)
      const snapshot = queryClient.getQueriesData<CachedTickets>(allTickets)
      const idSet = new Set(ids)
      const previous = collectStatuses(
        snapshot.map(([, value]) => value),
        idSet,
      )
      queryClient.setQueriesData<CachedTickets>(allTickets, (value) =>
        applyStatus(value, idSet, status),
      )
      return { snapshot, previous }
    },

    onError: (_error, _input, context) => {
      for (const [key, value] of context?.snapshot ?? []) queryClient.setQueryData(key, value)
    },

    onSuccess: (result, _input, context) => {
      const failed = new Set(result.failed.map((f) => f.id))
      const revert = new Map([...context.previous].filter(([id]) => failed.has(id)))
      const updated = new Map<string, Ticket>(result.updated.map((t) => [t.id, t]))
      queryClient.setQueriesData<CachedTickets>(allTickets, (value) =>
        mergeTickets(revertStatuses(value, revert), updated),
      )
    },

    // Reconcile with the server: filtered lists may now include/exclude different tickets.
    onSettled: () => queryClient.invalidateQueries(allTickets),
  })
}
