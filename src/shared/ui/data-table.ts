import type { SortOrder } from '@/shared/api/types'

export interface DataColumn {
  key: string
  label: string
  sortable?: boolean
  /** low: hidden in tables narrower than 1280px viewports; always shown in mobile cards. */
  priority?: 'high' | 'low'
  align?: 'start' | 'end'
}

export interface SortState {
  field: string
  order: SortOrder
}
