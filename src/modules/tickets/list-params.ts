import { z } from 'zod'
import { listParamsBase } from '@/shared/api/list-params'
import { TICKET_STATUSES } from './types'

export const TICKET_SORT_FIELDS = ['name', 'price', 'quantity', 'status', 'updatedAt'] as const

/** URL/query contract of the tickets list. Invalid values fall back to defaults. */
export const ticketListParamsSchema = z.object({
  ...listParamsBase(TICKET_SORT_FIELDS, 'updatedAt', 'desc'),
  status: z.enum(TICKET_STATUSES).optional().catch(undefined),
  eventId: z.string().min(1).optional().catch(undefined),
  categoryId: z.string().min(1).optional().catch(undefined),
})

export type TicketListParams = z.output<typeof ticketListParamsSchema>
