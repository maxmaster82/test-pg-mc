import type { EntitySummary } from '@/shared/api/types'
import type { Currency } from '@/shared/utils/money'

export const TICKET_STATUSES = ['draft', 'on_sale', 'paused', 'sold_out'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  draft: 'Draft',
  on_sale: 'On sale',
  paused: 'Paused',
  sold_out: 'Sold out',
}

export interface Ticket {
  id: string
  name: string
  /** Integer minor units (cents). */
  price: number
  currency: Currency
  /** Available inventory. */
  quantity: number
  status: TicketStatus
  eventId: string
  categoryId: string
  event: EntitySummary
  category: EntitySummary
  version: number
  createdAt: string
  updatedAt: string
}

export type BulkFailureCode = 'OUT_OF_STOCK' | 'NOT_FOUND'

export interface BulkStatusResult {
  updated: Ticket[]
  failed: { id: string; code: BulkFailureCode; message: string }[]
}
