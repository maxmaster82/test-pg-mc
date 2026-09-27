import type { SelectOption } from '@/shared/ui/SelectField.vue'
import { EVENT_STATUS_LABELS, EVENT_STATUSES } from './types'

export const EVENT_STATUS_OPTIONS: SelectOption[] = EVENT_STATUSES.map((value) => ({
  value,
  label: EVENT_STATUS_LABELS[value],
}))
