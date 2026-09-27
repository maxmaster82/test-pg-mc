import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { categoryKeys } from '@/modules/categories/keys'
import { eventKeys } from '@/modules/events/keys'
import { ticketsApi } from './api'
import { ticketKeys } from './keys'
import type { TicketListParams } from './list-params'
import type { TicketInput } from './schemas'
import type { Ticket } from './types'

export function useTicketsList(params: MaybeRefOrGetter<TicketListParams>) {
  return useQuery({
    queryKey: computed(() => ticketKeys.list(toValue(params))),
    // The signal aborts superseded requests, so only the latest search/page is ever rendered.
    queryFn: ({ signal, queryKey }) => ticketsApi.list(queryKey[2], signal),
    placeholderData: keepPreviousData,
  })
}

export function useTicket(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ticketKeys.detail(toValue(id))),
    queryFn: ({ signal, queryKey }) => ticketsApi.get(queryKey[2], signal),
  })
}

/** After any ticket write: lists and aggregate ticket counts on events/categories are stale. */
function useTicketWriteEffects() {
  const queryClient = useQueryClient()
  return {
    storeDetail: (ticket: Ticket) => {
      queryClient.setQueryData(ticketKeys.detail(ticket.id), ticket)
    },
    invalidateRelated: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ticketKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: eventKeys.all }),
        queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
      ]),
    forgetDetail: (id: string) => {
      queryClient.removeQueries({ queryKey: ticketKeys.detail(id) })
    },
  }
}

export function useCreateTicket() {
  const effects = useTicketWriteEffects()
  return useMutation({
    mutationFn: (input: TicketInput) => ticketsApi.create(input),
    onSuccess: async (ticket) => {
      effects.storeDetail(ticket)
      await effects.invalidateRelated()
    },
  })
}

export function useUpdateTicket() {
  const effects = useTicketWriteEffects()
  return useMutation({
    mutationFn: ({ id, input, version }: { id: string; input: TicketInput; version: number }) =>
      ticketsApi.update(id, { ...input, version }),
    onSuccess: async (ticket) => {
      effects.storeDetail(ticket)
      await effects.invalidateRelated()
    },
  })
}

export function useDeleteTicket() {
  const effects = useTicketWriteEffects()
  return useMutation({
    mutationFn: (id: string) => ticketsApi.remove(id),
    onSuccess: async (_result, id) => {
      effects.forgetDetail(id)
      await effects.invalidateRelated()
    },
  })
}
