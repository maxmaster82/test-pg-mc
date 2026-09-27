import { http } from '@/shared/api/http'
import type { Paginated } from '@/shared/api/types'
import type { TicketListParams } from './list-params'
import type { BulkStatusInput, TicketInput, TicketUpdate } from './schemas'
import type { BulkStatusResult, Ticket } from './types'

/** Repository for the tickets resource. The only place that knows ticket endpoint URLs. */
export const ticketsApi = {
  list: (params: TicketListParams, signal?: AbortSignal) =>
    http.get<Paginated<Ticket>>('/tickets', { query: { ...params }, signal }),
  get: (id: string, signal?: AbortSignal) =>
    http.get<Ticket>(`/tickets/${encodeURIComponent(id)}`, { signal }),
  create: (input: TicketInput) => http.post<Ticket>('/tickets', input),
  update: (id: string, input: TicketUpdate) =>
    http.patch<Ticket>(`/tickets/${encodeURIComponent(id)}`, input),
  remove: (id: string) => http.delete(`/tickets/${encodeURIComponent(id)}`),
  /** One request for many tickets; the response reports per-ticket success or failure. */
  bulkUpdateStatus: (input: BulkStatusInput) =>
    http.post<BulkStatusResult>('/tickets/bulk-status', input),
}
