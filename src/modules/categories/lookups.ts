import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import type { SelectOption } from '@/shared/ui/SelectField.vue'
import { categoriesApi } from './api'
import { categoryKeys } from './keys'

/** Categories are a short, bounded list: loaded once for selects and filters. */
export function useCategoryOptions() {
  const query = useQuery({
    queryKey: categoryKeys.options(),
    queryFn: ({ signal }) =>
      categoriesApi.list({ pageSize: 50, sort: 'name', order: 'asc' }, signal),
    staleTime: 60_000,
  })
  const options = computed<SelectOption[]>(
    () => query.data.value?.data.map((c) => ({ value: c.id, label: c.name })) ?? [],
  )
  return { options, isLoading: query.isLoading, isError: query.isError }
}
