import type { Category } from '@/modules/categories/types'
import type { EventItem } from '@/modules/events/types'
import type { Ticket } from '@/modules/tickets/types'
import type { DbData, CategoryRecord, EventRecord, TicketRecord } from './types'

/** Response shapes: what a real API would join/aggregate before responding. */
export function toTicket(data: DbData, record: TicketRecord): Ticket {
  const event = data.events.find((e) => e.id === record.eventId)
  const category = data.categories.find((c) => c.id === record.categoryId)
  return {
    ...record,
    event: { id: record.eventId, name: event?.name ?? 'Unknown event' },
    category: { id: record.categoryId, name: category?.name ?? 'Unknown category' },
  }
}

function countBy(tickets: TicketRecord[], key: 'eventId' | 'categoryId'): Map<string, number> {
  const counts = new Map<string, number>()
  for (const ticket of tickets) counts.set(ticket[key], (counts.get(ticket[key]) ?? 0) + 1)
  return counts
}

export function eventsWithCounts(data: DbData): EventItem[] {
  const counts = countBy(data.tickets, 'eventId')
  return data.events.map((e: EventRecord) => ({ ...e, ticketCount: counts.get(e.id) ?? 0 }))
}

export function categoriesWithCounts(data: DbData): Category[] {
  const counts = countBy(data.tickets, 'categoryId')
  return data.categories.map((c: CategoryRecord) => ({ ...c, ticketCount: counts.get(c.id) ?? 0 }))
}
