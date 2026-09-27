import { http } from '@/shared/api/http'
import type { Paginated } from '@/shared/api/types'
import type { EventListParams } from './list-params'
import type { EventInput, EventUpdate } from './schemas'
import type { EventItem } from './types'

/** Loose parameters for lookups (pickers) in other modules. */
export interface EventLookupParams {
  q?: string
  pageSize?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export const eventsApi = {
  list: (params: EventListParams | EventLookupParams, signal?: AbortSignal) =>
    http.get<Paginated<EventItem>>('/events', { query: { ...params }, signal }),
  get: (id: string, signal?: AbortSignal) =>
    http.get<EventItem>(`/events/${encodeURIComponent(id)}`, { signal }),
  create: (input: EventInput) => http.post<EventItem>('/events', input),
  update: (id: string, input: EventUpdate) =>
    http.patch<EventItem>(`/events/${encodeURIComponent(id)}`, input),
  remove: (id: string) => http.delete(`/events/${encodeURIComponent(id)}`),
}
