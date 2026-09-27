import { z } from 'zod'
import { listParamsBase } from '@/shared/api/list-params'
import { COUNTRY_CODES } from './countries'
import { EVENT_STATUSES } from './types'

export const EVENT_SORT_FIELDS = ['name', 'startDate', 'status'] as const

export const eventListParamsSchema = z.object({
  ...listParamsBase(EVENT_SORT_FIELDS, 'startDate', 'asc'),
  status: z.enum(EVENT_STATUSES).optional().catch(undefined),
  country: z.enum(COUNTRY_CODES).optional().catch(undefined),
})

export type EventListParams = z.output<typeof eventListParamsSchema>
