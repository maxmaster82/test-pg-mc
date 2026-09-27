import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { ticketKeys } from '@/modules/tickets/keys'
import { categoriesApi } from './api'
import { categoryKeys } from './keys'
import type { CategoryListParams } from './list-params'
import type { CategoryInput } from './schemas'
import type { Category } from './types'

export function useCategoriesList(params: MaybeRefOrGetter<CategoryListParams>) {
  return useQuery({
    queryKey: computed(() => categoryKeys.list(toValue(params))),
    queryFn: ({ signal }) => categoriesApi.list(toValue(params), signal),
    placeholderData: keepPreviousData,
  })
}

export function useCategory(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => categoryKeys.detail(toValue(id))),
    queryFn: ({ signal, queryKey }) => categoriesApi.get(queryKey[2], signal),
  })
}

/** Tickets embed category names, so every category write also invalidates ticket queries. */
function useCategoryWriteEffects() {
  const queryClient = useQueryClient()
  return {
    afterWrite: async (category?: Category) => {
      if (category) queryClient.setQueryData(categoryKeys.detail(category.id), category)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ticketKeys.all }),
      ])
    },
    forget: (id: string) => {
      queryClient.removeQueries({ queryKey: categoryKeys.detail(id) })
    },
  }
}

export function useCreateCategory() {
  const effects = useCategoryWriteEffects()
  return useMutation({
    mutationFn: (input: CategoryInput) => categoriesApi.create(input),
    onSuccess: (category) => effects.afterWrite(category),
  })
}

export function useUpdateCategory() {
  const effects = useCategoryWriteEffects()
  return useMutation({
    mutationFn: ({ id, input, version }: { id: string; input: CategoryInput; version: number }) =>
      categoriesApi.update(id, { ...input, version }),
    onSuccess: (category) => effects.afterWrite(category),
  })
}

export function useDeleteCategory() {
  const effects = useCategoryWriteEffects()
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: async (_result, id) => {
      effects.forget(id)
      await effects.afterWrite()
    },
  })
}
