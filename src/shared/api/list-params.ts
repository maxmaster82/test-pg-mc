import { z } from 'zod'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, type SortOrder } from './types'

/**
 * Shared list parameters (search, sort, pagination) for URL-driven list pages.
 * Every field uses `.catch()` so malformed URLs degrade to defaults instead of erroring.
 */
export function listParamsBase<const S extends readonly [string, ...string[]]>(
  sortFields: S,
  defaultSort: S[number],
  defaultOrder: SortOrder,
) {
  return {
    q: z.string().trim().catch(''),
    sort: z
      .enum(sortFields)
      .catch(defaultSort as never)
      .default(defaultSort as never),
    order: z.enum(['asc', 'desc']).catch(defaultOrder).default(defaultOrder),
    page: z.coerce.number().int().min(1).catch(1).default(1),
    pageSize: z.coerce
      .number()
      .refine((n) => (PAGE_SIZES as readonly number[]).includes(n))
      .catch(DEFAULT_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
  }
}
