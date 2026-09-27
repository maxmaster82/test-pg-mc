import { z } from 'zod'
import { listParamsBase } from '@/shared/api/list-params'

export const CATEGORY_SORT_FIELDS = ['name', 'updatedAt'] as const

export const categoryListParamsSchema = z.object({
  ...listParamsBase(CATEGORY_SORT_FIELDS, 'name', 'asc'),
})

export type CategoryListParams = z.output<typeof categoryListParamsSchema>
