import { z } from 'zod'
import { optionalText, requiredText } from '@/shared/validation/rules'
import type { Category } from './types'

const fields = {
  name: requiredText('Name', 2, 60),
  description: optionalText('Description', 500),
}

/** Same shape for the form and the API: both fields are plain text. Also enforced by the mock API. */
export const categoryInputSchema = z.object(fields)
export type CategoryInput = z.output<typeof categoryInputSchema>

export const categoryUpdateSchema = categoryInputSchema.extend({ version: z.number().int().min(1) })
export type CategoryUpdate = z.output<typeof categoryUpdateSchema>

export const categoryFormSchema = categoryInputSchema
export type CategoryFormValues = z.input<typeof categoryFormSchema>

export const DUPLICATE_CATEGORY_NAME = 'A category with this name already exists'

export const emptyCategoryForm = (): CategoryFormValues => ({ name: '', description: '' })

export const toCategoryFormValues = (category: Category): CategoryFormValues => ({
  name: category.name,
  description: category.description,
})
