import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { categoriesApi } from '@/modules/categories/api'
import { categoryKeys } from '@/modules/categories/keys'
import { categoryListParamsSchema } from '@/modules/categories/list-params'
import { eventsApi } from '@/modules/events/api'
import { eventKeys } from '@/modules/events/keys'
import { eventListParamsSchema } from '@/modules/events/list-params'
import { ticketsApi } from '@/modules/tickets/api'
import { ticketKeys } from '@/modules/tickets/keys'
import { ticketListParamsSchema } from '@/modules/tickets/list-params'
import { TICKET_STATUSES, type TicketStatus } from '@/modules/tickets/types'

/**
 * Overview counts derived from list totals (smallest page). Reusing the list query keys means the
 * existing mutation invalidation keeps them fresh. A dedicated /stats endpoint is the scaling path.
 */
export function useOverviewStats() {
  const smallest = { pageSize: 10 } as const

  const ticketsQuery = (status?: TicketStatus) => {
    const params = ticketListParamsSchema.parse({ ...smallest, status })
    return useQuery({
      queryKey: ticketKeys.list(params),
      queryFn: ({ signal }) => ticketsApi.list(params, signal),
    })
  }

  const eventParams = eventListParamsSchema.parse(smallest)
  const categoryParams = categoryListParamsSchema.parse(smallest)

  const tickets = ticketsQuery()
  const byStatus = TICKET_STATUSES.map((status) => ({ status, query: ticketsQuery(status) }))
  const events = useQuery({
    queryKey: eventKeys.list(eventParams),
    queryFn: ({ signal }) => eventsApi.list(eventParams, signal),
  })
  const categories = useQuery({
    queryKey: categoryKeys.list(categoryParams),
    queryFn: ({ signal }) => categoriesApi.list(categoryParams, signal),
  })

  return {
    totals: computed(() => ({
      tickets: tickets.data.value?.meta.total,
      events: events.data.value?.meta.total,
      categories: categories.data.value?.meta.total,
    })),
    ticketsByStatus: computed(() =>
      byStatus.map(({ status, query }) => ({ status, count: query.data.value?.meta.total })),
    ),
    isError: computed(() => [tickets, events, categories].some((q) => q.isError.value)),
    retry: () => Promise.all([tickets.refetch(), events.refetch(), categories.refetch()]),
  }
}
