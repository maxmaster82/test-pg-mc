import type { SelectOption } from '@/shared/ui/SelectField.vue'
import { CURRENCIES } from '@/shared/utils/money'
import { TICKET_STATUS_LABELS, TICKET_STATUSES } from './types'

export const TICKET_STATUS_OPTIONS: SelectOption[] = TICKET_STATUSES.map((value) => ({
  value,
  label: TICKET_STATUS_LABELS[value],
}))

export const CURRENCY_OPTIONS: SelectOption[] = CURRENCIES.map((value) => ({ value, label: value }))
