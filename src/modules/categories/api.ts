import { http } from '@/shared/api/http'
import type { Paginated } from '@/shared/api/types'
import type { CategoryListParams } from './list-params'
import type { CategoryInput, CategoryUpdate } from './schemas'
import type { Category } from './types'

export interface CategoryLookupParams {
  q?: string
  pageSize?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export const categoriesApi = {
  list: (params: CategoryListParams | CategoryLookupParams, signal?: AbortSignal) =>
    http.get<Paginated<Category>>('/categories', { query: { ...params }, signal }),
  get: (id: string, signal?: AbortSignal) =>
    http.get<Category>(`/categories/${encodeURIComponent(id)}`, { signal }),
  create: (input: CategoryInput) => http.post<Category>('/categories', input),
  update: (id: string, input: CategoryUpdate) =>
    http.patch<Category>(`/categories/${encodeURIComponent(id)}`, input),
  remove: (id: string) => http.delete(`/categories/${encodeURIComponent(id)}`),
}
