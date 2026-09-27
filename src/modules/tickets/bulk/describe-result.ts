import { pluralize } from '@/shared/utils/format'
import { TICKET_STATUS_LABELS, type BulkStatusResult, type TicketStatus } from '../types'

/** Human-readable outcome announced after a bulk status change. */
export function describeBulkResult(result: BulkStatusResult, status: TicketStatus): string {
  const total = result.updated.length + result.failed.length
  const label = TICKET_STATUS_LABELS[status]
  if (result.failed.length === 0) {
    return `${pluralize(result.updated.length, 'ticket')} set to ${label}.`
  }
  const outOfStock = result.failed.filter((f) => f.code === 'OUT_OF_STOCK').length
  const missing = result.failed.length - outOfStock
  const reasons = [
    outOfStock > 0 &&
      `${pluralize(outOfStock, 'ticket')} could not be put on sale because ${outOfStock === 1 ? 'it is' : 'they are'} out of stock.`,
    missing > 0 &&
      `${pluralize(missing, 'ticket')} no longer ${missing === 1 ? 'exists' : 'exist'}.`,
  ].filter(Boolean)
  const lead =
    result.updated.length === 0
      ? `None of the ${pluralize(total, 'ticket')} were updated.`
      : `${result.updated.length} of ${pluralize(total, 'ticket')} updated.`
  return [lead, ...reasons].join(' ')
}
