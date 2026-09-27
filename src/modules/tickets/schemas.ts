import { z } from 'zod'
import { CURRENCIES, toDecimalString } from '@/shared/utils/money'
import {
  integerInput,
  moneyInput,
  requiredChoice,
  requiredId,
  requiredText,
} from '@/shared/validation/rules'
import { TICKET_STATUSES, type Ticket } from './types'

export const TICKET_LIMITS = {
  nameMin: 2,
  nameMax: 120,
  maxPriceMinor: 10_000_000, // 100,000.00
  maxQuantity: 1_000_000,
} as const

/** API contract for create/update bodies (money in minor units). Also enforced by the mock API. */
export const ticketInputSchema = z.object({
  name: requiredText('Name', TICKET_LIMITS.nameMin, TICKET_LIMITS.nameMax),
  price: z
    .number({ error: 'Price is required' })
    .int('Price must be in minor units')
    .min(0, 'Price cannot be negative')
    .max(TICKET_LIMITS.maxPriceMinor, 'Price must be at most 100000'),
  currency: requiredChoice('Currency', CURRENCIES),
  quantity: z
    .number({ error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .max(TICKET_LIMITS.maxQuantity, 'Quantity must be at most 1,000,000'),
  status: requiredChoice('Status', TICKET_STATUSES),
  eventId: requiredId('Event'),
  categoryId: requiredId('Category'),
})
export type TicketInput = z.output<typeof ticketInputSchema>

export const ticketUpdateSchema = ticketInputSchema.extend({
  version: z.number().int().min(1),
})
export type TicketUpdate = z.output<typeof ticketUpdateSchema>

/** Form values are strings as typed by the user; the schema converts them to a TicketInput. */
export const ticketFormSchema = z.object({
  name: requiredText('Name', TICKET_LIMITS.nameMin, TICKET_LIMITS.nameMax),
  price: moneyInput('Price', TICKET_LIMITS.maxPriceMinor),
  currency: requiredChoice('Currency', CURRENCIES),
  quantity: integerInput('Quantity', 0, TICKET_LIMITS.maxQuantity),
  status: requiredChoice('Status', TICKET_STATUSES),
  eventId: requiredId('Event'),
  categoryId: requiredId('Category'),
}) satisfies z.ZodType<TicketInput, Record<keyof TicketInput, string>>

export type TicketFormValues = z.input<typeof ticketFormSchema>

export const emptyTicketForm = (): TicketFormValues => ({
  name: '',
  price: '',
  currency: 'EUR',
  quantity: '',
  status: 'draft',
  eventId: '',
  categoryId: '',
})

export function toTicketFormValues(ticket: Ticket): TicketFormValues {
  return {
    name: ticket.name,
    price: toDecimalString(ticket.price),
    currency: ticket.currency,
    quantity: String(ticket.quantity),
    status: ticket.status,
    eventId: ticket.eventId,
    categoryId: ticket.categoryId,
  }
}

export const BULK_LIMIT = 100

export const bulkStatusSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, 'Select at least one ticket')
    .max(BULK_LIMIT, `Select up to ${BULK_LIMIT} tickets`),
  status: requiredChoice('Status', TICKET_STATUSES),
})
export type BulkStatusInput = z.output<typeof bulkStatusSchema>
