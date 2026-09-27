import { computed, shallowRef } from 'vue'
import type { Ticket } from '../types'

export type PageSelection = 'all' | 'some' | 'none'

/**
 * Page-scoped selection that survives pagination (ids + summaries of tickets on other pages).
 * Deliberately not in Pinia: it is ephemeral UI state owned by one list page instance.
 */
export function useTicketSelection() {
  const selected = shallowRef(new Map<string, Ticket>())

  const count = computed(() => selected.value.size)
  const ids = computed(() => [...selected.value.keys()])

  function replace(next: Map<string, Ticket>) {
    selected.value = next
  }

  function isSelected(id: string) {
    return selected.value.has(id)
  }

  function toggle(ticket: Ticket) {
    const next = new Map(selected.value)
    if (next.has(ticket.id)) next.delete(ticket.id)
    else next.set(ticket.id, ticket)
    replace(next)
  }

  function pageState(tickets: Ticket[]): PageSelection {
    const onPage = tickets.filter((t) => selected.value.has(t.id)).length
    if (onPage === 0) return 'none'
    return onPage === tickets.length ? 'all' : 'some'
  }

  /** Header checkbox: select every ticket on the page, or clear them if all are selected. */
  function togglePage(tickets: Ticket[]) {
    const next = new Map(selected.value)
    if (pageState(tickets) === 'all') for (const t of tickets) next.delete(t.id)
    else for (const t of tickets) next.set(t.id, t)
    replace(next)
  }

  function keepOnly(keep: Iterable<string>) {
    const wanted = new Set(keep)
    replace(new Map([...selected.value].filter(([id]) => wanted.has(id))))
  }

  function clear() {
    if (selected.value.size > 0) replace(new Map())
  }

  return { count, ids, isSelected, toggle, pageState, togglePage, keepOnly, clear }
}

export type TicketSelection = ReturnType<typeof useTicketSelection>
