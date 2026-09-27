import type { User } from '@/modules/auth/types'
import type { Category } from '@/modules/categories/types'
import type { EventItem } from '@/modules/events/types'
import type { Ticket } from '@/modules/tickets/types'

/** Stored shapes: derived/embedded fields are computed by handlers, as a real API would. */
export type CategoryRecord = Omit<Category, 'ticketCount'>
export type EventRecord = Omit<EventItem, 'ticketCount'>
export type TicketRecord = Omit<Ticket, 'event' | 'category'>

export interface UserRecord extends User {
  /** Demo-only plain text password for the seeded fake administrator. */
  password: string
}

export interface SessionRecord {
  token: string
  userId: string
}

export interface DbData {
  users: UserRecord[]
  sessions: SessionRecord[]
  categories: CategoryRecord[]
  events: EventRecord[]
  tickets: TicketRecord[]
  /** Monotonic counter for generated ids. */
  sequence: number
}
