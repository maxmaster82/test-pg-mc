import { DEFAULT_PAGE_SIZE, PAGE_SIZES, type Paginated, type SortOrder } from '@/shared/api/types'

export interface ListDefinition<T> {
  /** Whitelisted sort fields and how to read them. */
  sortFields: Record<string, (item: T) => string | number>
  defaultSort: string
  defaultOrder: SortOrder
  /** Values matched by `q` (case-insensitive substring). */
  searchFields: (item: T) => string[]
  /** Exact-match filters keyed by query parameter name. */
  filters?: Record<string, (item: T, value: string) => boolean>
}

export interface ListQuery {
  page: number
  pageSize: number
  q: string
  sort: string
  order: SortOrder
  filters: Record<string, string>
}

export function parseListQuery<T>(
  params: URLSearchParams,
  definition: ListDefinition<T>,
): ListQuery {
  const page = Number(params.get('page'))
  const pageSize = Number(params.get('pageSize'))
  const sortParam = params.get('sort') ?? ''
  const sortValid = sortParam in definition.sortFields
  const orderParam = params.get('order')
  const filters: Record<string, string> = {}
  for (const key of Object.keys(definition.filters ?? {})) {
    const value = params.get(key)
    if (value) filters[key] = value
  }
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
    q: (params.get('q') ?? '').trim().toLowerCase(),
    sort: sortValid ? sortParam : definition.defaultSort,
    order:
      sortValid && (orderParam === 'asc' || orderParam === 'desc')
        ? orderParam
        : definition.defaultOrder,
    filters,
  }
}

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return collator.compare(String(a), String(b))
}

/** Search → filter → stable sort (id tiebreak) → paginate. Shared by every collection endpoint. */
export function runListQuery<T extends { id: string }>(
  items: readonly T[],
  query: ListQuery,
  definition: ListDefinition<T>,
): Paginated<T> {
  const read = definition.sortFields[query.sort]
  if (!read) throw new Error(`Unknown sort field "${query.sort}"`)
  const direction = query.order === 'asc' ? 1 : -1

  const matches = items.filter((item) => {
    if (query.q && !definition.searchFields(item).some((v) => v.toLowerCase().includes(query.q))) {
      return false
    }
    return Object.entries(query.filters).every(
      ([key, value]) => definition.filters?.[key]?.(item, value) ?? true,
    )
  })

  const sorted = [...matches].sort(
    (a, b) => compareValues(read(a), read(b)) * direction || collator.compare(a.id, b.id),
  )

  const total = sorted.length
  const start = (query.page - 1) * query.pageSize
  return {
    data: sorted.slice(start, start + query.pageSize),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  }
}
