export const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'completed'] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

/** Named EventItem to avoid shadowing the DOM `Event` type. */
export interface EventItem {
  id: string
  name: string
  /** ISO 3166-1 alpha-2 */
  country: string
  venue: string
  /** ISO 8601 date-time (UTC) */
  startDate: string
  endDate: string
  status: EventStatus
  ticketCount: number
  version: number
  createdAt: string
  updatedAt: string
}
