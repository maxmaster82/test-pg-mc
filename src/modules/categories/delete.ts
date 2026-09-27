import { useDeleteWithConfirm } from '@/shared/composables/useDeleteWithConfirm'
import { pluralize } from '@/shared/utils/format'
import { useDeleteCategory } from './queries'
import type { Category } from './types'

/** Delete with confirmation; explains the 409 when the category is still used by tickets. */
export function useRequestCategoryDelete(onDeleted?: () => unknown) {
  const remove = useDeleteCategory()
  const request = useDeleteWithConfirm<Category>({
    noun: 'category',
    remove: remove.mutateAsync,
    onDeleted,
    explainConflict: (category, error) => {
      const count = Number(error.details?.ticketCount ?? category.ticketCount)
      return {
        message: `${category.name} has ${pluralize(count, 'ticket')}. Delete or move them before deleting the category.`,
        resolveTo: { name: 'tickets', query: { categoryId: category.id } },
      }
    },
  })
  return { request, isPending: remove.isPending }
}
