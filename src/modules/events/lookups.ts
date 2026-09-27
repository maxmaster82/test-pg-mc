import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { EntitySummary } from '@/shared/api/types'
import { eventsApi } from './api'
import { eventKeys } from './keys'

const OPTIONS_LIMIT = 20

/** Server-side searched event options for pickers and filters (scales beyond one page of events). */
export function useEventOptions(term: MaybeRefOrGetter<string>) {
  const query = useQuery({
    queryKey: computed(() => eventKeys.options(toValue(term))),
    queryFn: ({ signal, queryKey }) =>
      eventsApi.list(
        { q: queryKey[2], pageSize: OPTIONS_LIMIT, sort: 'name', order: 'asc' },
        signal,
      ),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
  const options = computed<EntitySummary[]>(
    () => query.data.value?.data.map(({ id, name }) => ({ id, name })) ?? [],
  )
  return { options, isFetching: query.isFetching, isError: query.isError }
}

/** Resolves a single event's name (e.g. the currently applied filter). */
export function useEventName(id: MaybeRefOrGetter<string | undefined>) {
  const query = useQuery({
    queryKey: computed(() => eventKeys.detail(toValue(id) ?? '')),
    queryFn: ({ signal, queryKey }) => eventsApi.get(queryKey[2], signal),
    enabled: computed(() => Boolean(toValue(id))),
    staleTime: 60_000,
  })
  return computed(() => query.data.value?.name)
}
