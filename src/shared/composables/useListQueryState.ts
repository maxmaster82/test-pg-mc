import { computed, watch, type WatchSource } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import type { z } from 'zod'
import type { PaginationMeta, SortOrder } from '@/shared/api/types'

/** Keys that describe how results are presented, not which results are shown. */
const PRESENTATION_KEYS = new Set(['sort', 'order', 'page', 'pageSize'])

function firstValues(query: LocationQuery): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    const first = Array.isArray(value) ? value[0] : value
    if (typeof first === 'string') result[key] = first
  }
  return result
}

function sameQuery(a: LocationQueryRaw, b: LocationQuery): boolean {
  const flatB = firstValues(b)
  const keysA = Object.keys(a)
  return keysA.length === Object.keys(b).length && keysA.every((k) => String(a[k]) === flatB[k])
}

interface UpdateOptions {
  /** Replace the history entry (used while typing a search) instead of pushing one. */
  replace?: boolean
}

/**
 * URL-synchronized list state (search, filters, sort, pagination), validated by a Zod schema
 * whose fields all have defaults/fallbacks. The URL is the single source of truth.
 */
interface ListParamsShape {
  page: number
  sort: string
  order: SortOrder
}

interface ListOptions<P extends ListParamsShape> {
  /** Initial order when switching to a column (default "asc"), e.g. newest-first for dates. */
  initialOrder?: Partial<Record<P['sort'], SortOrder>>
}

export function useListQueryState<P extends ListParamsShape>(
  schema: z.ZodType<P>,
  { initialOrder = {} }: ListOptions<P> = {},
) {
  const route = useRoute()
  const router = useRouter()
  const routeName = route.name
  const defaults = schema.parse({})

  const params = computed<P>(() => schema.parse(firstValues(route.query)))

  function toQuery(values: P): LocationQueryRaw {
    const query: LocationQueryRaw = {}
    for (const [key, value] of Object.entries(values) as [string, unknown][]) {
      if (value === '' || value === defaults[key as keyof P]) continue
      if (typeof value === 'string' || typeof value === 'number') query[key] = String(value)
    }
    return query
  }

  function update(patch: Partial<P>, { replace = false }: UpdateOptions = {}) {
    const next: P = { ...params.value, ...patch }
    // Any change other than the page itself invalidates the current page number.
    if (!('page' in patch)) next.page = 1
    const location = { query: toQuery(next) }
    return replace ? router.replace(location) : router.push(location)
  }

  /**
   * Header click: toggle the order of the current column, or switch column using its initial order.
   * An explicit order (mobile sort menu) is applied as-is.
   */
  function sortBy(field: string, order?: SortOrder) {
    const sort = field as P['sort']
    const current = params.value
    const toggled: SortOrder = current.order === 'asc' ? 'desc' : 'asc'
    const next = order ?? (current.sort === sort ? toggled : (initialOrder[sort] ?? 'asc'))
    return update({ sort, order: next } as Partial<P>)
  }

  /** Keeps the page in range when the result set shrinks (e.g. the last item of the last page was deleted). */
  function keepPageInBounds(meta: WatchSource<PaginationMeta | undefined>) {
    watch(meta, (value) => {
      // totalPages is at least 1, so an empty result set also returns to page 1.
      if (value && params.value.page > value.totalPages) {
        void update({ page: value.totalPages } as Partial<P>, { replace: true })
      }
    })
  }

  const hasActiveFilters = computed(() =>
    Object.entries(params.value).some(
      ([key, value]) => !PRESENTATION_KEYS.has(key) && value !== defaults[key as keyof P],
    ),
  )

  function clearFilters() {
    const cleared = Object.fromEntries(
      Object.keys(params.value)
        .filter((key) => !PRESENTATION_KEYS.has(key))
        .map((key) => [key, defaults[key as keyof P]]),
    ) as Partial<P>
    return update(cleared)
  }

  // Normalize malformed or redundant URLs (e.g. ?page=abc) to their canonical form.
  watch(
    () => route.query,
    (query) => {
      if (route.name !== routeName) return
      const canonical = toQuery(params.value)
      if (!sameQuery(canonical, query)) void router.replace({ query: canonical })
    },
    { immediate: true },
  )

  return { params, update, sortBy, keepPageInBounds, clearFilters, hasActiveFilters }
}
