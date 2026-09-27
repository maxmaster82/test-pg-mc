import type { Paginated } from '@/shared/api/types'
import type { Ticket, TicketStatus } from '../types'

/**
 * Pure transforms for the optimistic bulk status update (ADR 0005). Each accepts any cached
 * value under the `tickets` key (a list page, a single ticket, or nothing) and returns a new one.
 */
export type CachedTickets = Paginated<Ticket> | Ticket | undefined

function mapTickets(value: CachedTickets, fn: (ticket: Ticket) => Ticket): CachedTickets {
  if (!value) return value
  if ('data' in value) {
    const data = value.data.map(fn)
    // Keep the same object when nothing changed, so untouched cache entries do not re-render.
    return data.some((ticket, i) => ticket !== value.data[i]) ? { ...value, data } : value
  }
  return fn(value)
}

export function applyStatus(value: CachedTickets, ids: ReadonlySet<string>, status: TicketStatus) {
  return mapTickets(value, (t) => (ids.has(t.id) && t.status !== status ? { ...t, status } : t))
}

/** Statuses as they were before the optimistic change, keyed by ticket id. */
export function collectStatuses(values: CachedTickets[], ids: ReadonlySet<string>) {
  const statuses = new Map<string, TicketStatus>()
  for (const value of values) {
    mapTickets(value, (t) => {
      if (ids.has(t.id) && !statuses.has(t.id)) statuses.set(t.id, t.status)
      return t
    })
  }
  return statuses
}

/** Partial failure: put back only the tickets the server refused, leaving everything else alone. */
export function revertStatuses(value: CachedTickets, previous: ReadonlyMap<string, TicketStatus>) {
  return mapTickets(value, (t) => {
    const status = previous.get(t.id)
    return status !== undefined && t.status !== status ? { ...t, status } : t
  })
}

/** Replace cached tickets with the server's authoritative copies (new version, updatedAt). */
export function mergeTickets(value: CachedTickets, updated: ReadonlyMap<string, Ticket>) {
  return mapTickets(value, (t) => updated.get(t.id) ?? t)
}
