import { http, HttpResponse } from 'msw'
import {
  categoryInputSchema,
  categoryUpdateSchema,
  DUPLICATE_CATEGORY_NAME,
} from '@/modules/categories/schemas'
import type { Category } from '@/modules/categories/types'
import type { MockContext } from '../context'
import { parseListQuery, runListQuery, type ListDefinition } from '../db/list-engine'
import { categoriesWithCounts } from '../db/relations'
import { apiError, notFound, readJson, route, validationFailed, zodFieldErrors } from './http-utils'

export const categoryList: ListDefinition<Category> = {
  sortFields: {
    name: (c) => c.name,
    updatedAt: (c) => c.updatedAt,
    ticketCount: (c) => c.ticketCount,
  },
  defaultSort: 'name',
  defaultOrder: 'asc',
  searchFields: (c) => [c.name, c.description],
}

export function categoryHandlers(ctx: MockContext) {
  const { db } = ctx
  const withCount = (id: string) => categoriesWithCounts(db.data).find((c) => c.id === id)
  const nameTaken = (name: string, exceptId?: string) =>
    db.data.categories.some(
      (c) => c.id !== exceptId && c.name.localeCompare(name, 'en', { sensitivity: 'base' }) === 0,
    )

  return [
    http.get(
      '/api/categories',
      route(ctx, ({ request }) => {
        const query = parseListQuery(new URL(request.url).searchParams, categoryList)
        return HttpResponse.json(runListQuery(categoriesWithCounts(db.data), query, categoryList))
      }),
    ),

    http.get(
      '/api/categories/:id',
      route<{ id: string }>(ctx, ({ params }) => {
        const category = withCount(params.id)
        return category ? HttpResponse.json(category) : notFound('Category')
      }),
    ),

    http.post(
      '/api/categories',
      route(ctx, async ({ request }) => {
        const parsed = categoryInputSchema.safeParse(await readJson(request))
        if (!parsed.success) return validationFailed(zodFieldErrors(parsed.error))
        if (nameTaken(parsed.data.name)) return validationFailed({ name: DUPLICATE_CATEGORY_NAME })
        const now = new Date().toISOString()
        const record = {
          id: db.nextId('cat'),
          ...parsed.data,
          version: 1,
          createdAt: now,
          updatedAt: now,
        }
        db.data.categories.push(record)
        db.commit()
        return HttpResponse.json(withCount(record.id), { status: 201 })
      }),
    ),

    http.patch(
      '/api/categories/:id',
      route<{ id: string }>(ctx, async ({ params, request }) => {
        const record = db.data.categories.find((c) => c.id === params.id)
        if (!record) return notFound('Category')
        const parsed = categoryUpdateSchema.safeParse(await readJson(request))
        if (!parsed.success) return validationFailed(zodFieldErrors(parsed.error))
        const { version, ...changes } = parsed.data
        if (version !== record.version) {
          return apiError(409, 'CONFLICT', 'This category was changed by someone else.', {
            details: { currentVersion: record.version },
          })
        }
        if (nameTaken(changes.name, record.id))
          return validationFailed({ name: DUPLICATE_CATEGORY_NAME })
        Object.assign(record, changes, {
          version: record.version + 1,
          updatedAt: new Date().toISOString(),
        })
        db.commit()
        return HttpResponse.json(withCount(record.id))
      }),
    ),

    http.delete(
      '/api/categories/:id',
      route<{ id: string }>(ctx, ({ params }) => {
        const category = withCount(params.id)
        if (!category) return notFound('Category')
        if (category.ticketCount > 0) {
          return apiError(409, 'CONFLICT', `${category.name} still has tickets.`, {
            details: { ticketCount: category.ticketCount },
          })
        }
        db.data.categories = db.data.categories.filter((c) => c.id !== params.id)
        db.commit()
        return new HttpResponse(null, { status: 204 })
      }),
    ),
  ]
}
