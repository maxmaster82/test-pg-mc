import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { ticketKeys } from '@/modules/tickets/keys'
import { eventsApi } from './api'
import { eventKeys } from './keys'
import type { EventListParams } from './list-params'
import type { EventInput } from './schemas'
import type { EventItem } from './types'

export function useEventsList(params: MaybeRefOrGetter<EventListParams>) {
  return useQuery({
    queryKey: computed(() => eventKeys.list(toValue(params))),
    queryFn: ({ signal }) => eventsApi.list(toValue(params), signal),
    placeholderData: keepPreviousData,
  })
}

export function useEvent(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => eventKeys.detail(toValue(id))),
    queryFn: ({ signal, queryKey }) => eventsApi.get(queryKey[2], signal),
  })
}

/** Tickets embed event names, so every event write also invalidates ticket queries. */
function useEventWriteEffects() {
  const queryClient = useQueryClient()
  return {
    afterWrite: async (event?: EventItem) => {
      if (event) queryClient.setQueryData(eventKeys.detail(event.id), event)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eventKeys.all }),
        queryClient.invalidateQueries({ queryKey: ticketKeys.all }),
      ])
    },
    forget: (id: string) => {
      queryClient.removeQueries({ queryKey: eventKeys.detail(id) })
    },
  }
}

export function useCreateEvent() {
  const effects = useEventWriteEffects()
  return useMutation({
    mutationFn: (input: EventInput) => eventsApi.create(input),
    onSuccess: (event) => effects.afterWrite(event),
  })
}

export function useUpdateEvent() {
  const effects = useEventWriteEffects()
  return useMutation({
    mutationFn: ({ id, input, version }: { id: string; input: EventInput; version: number }) =>
      eventsApi.update(id, { ...input, version }),
    onSuccess: (event) => effects.afterWrite(event),
  })
}

export function useDeleteEvent() {
  const effects = useEventWriteEffects()
  return useMutation({
    mutationFn: (id: string) => eventsApi.remove(id),
    onSuccess: async (_result, id) => {
      effects.forget(id)
      await effects.afterWrite()
    },
  })
}
