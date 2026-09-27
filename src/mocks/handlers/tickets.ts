import { http, HttpResponse } from 'msw'
import { bulkStatusSchema, ticketInputSchema, ticketUpdateSchema } from '@/modules/tickets/schemas'
import type { BulkStatusResult, Ticket } from '@/modules/tickets/types'
import type { FieldErrors } from '@/shared/api/types'
import type { MockContext } from '../context'
import { parseListQuery, runListQuery, type ListDefinition } from '../db/list-engine'
import { toTicket } from '../db/relations'
import type { DbData } from '../db/types'
import { apiError, notFound, readJson, route, validationFailed, zodFieldErrors } from './http-utils'

const ticketList: ListDefinition<Ticket> = {
  sortFields: {
    name: (t) => t.name,
    price: (t) => t.price,
    quantity: (t) => t.quantity,
    status: (t) => t.status,
    updatedAt: (t) => t.updatedAt,
  },
  defaultSort: 'updatedAt',
  defaultOrder: 'desc',
  searchFields: (t) => [t.name],
  filters: {
    status: (t, v) => t.status === v,
    eventId: (t, v) => t.eventId === v,
    categoryId: (t, v) => t.categoryId === v,
  },
}

function referenceErrors(
  data: DbData,
  input: { eventId?: string; categoryId?: string },
): FieldErrors {
  const errors: FieldErrors = {}
  if (input.eventId !== undefined && !data.events.some((e) => e.id === input.eventId)) {
    errors.eventId = 'Selected event no longer exists'
  }
  if (input.categoryId !== undefined && !data.categories.some((c) => c.id === input.categoryId)) {
    errors.categoryId = 'Selected category no longer exists'
  }
  return errors
}

export function ticketHandlers(ctx: MockContext) {
  const { db } = ctx
  return [
    http.get(
      '/api/tickets',
      route(ctx, ({ request }) => {
        const tickets = db.data.tickets.map((t) => toTicket(db.data, t))
        const query = parseListQuery(new URL(request.url).searchParams, ticketList)
        return HttpResponse.json(runListQuery(tickets, query, ticketList))
      }),
    ),

    // Registered before '/api/tickets/:id' routes; POST-only so it never collides with them.
    http.post(
      '/api/tickets/bulk-status',
      route(ctx, async ({ request }) => {
        const parsed = bulkStatusSchema.safeParse(await readJson(request))
        if (!parsed.success) return validationFailed(zodFieldErrors(parsed.error))
        const { ids, status } = parsed.data
        const result: BulkStatusResult = { updated: [], failed: [] }
        const now = new Date().toISOString()
        for (const id of new Set(ids)) {
          const record = db.data.tickets.find((t) => t.id === id)
          if (!record) {
            result.failed.push({ id, code: 'NOT_FOUND', message: 'Ticket no longer exists' })
          } else if (status === 'on_sale' && record.quantity === 0) {
            // Business rule: nothing to sell.
            result.failed.push({ id, code: 'OUT_OF_STOCK', message: 'Out of stock' })
          } else {
            if (record.status !== status) {
              Object.assign(record, { status, version: record.version + 1, updatedAt: now })
            }
            result.updated.push(toTicket(db.data, record))
          }
        }
        db.commit()
        return HttpResponse.json(result)
      }),
    ),

    http.get(
      '/api/tickets/:id',
      route<{ id: string }>(ctx, ({ params }) => {
        const record = db.data.tickets.find((t) => t.id === params.id)
        return record ? HttpResponse.json(toTicket(db.data, record)) : notFound('Ticket')
      }),
    ),

    http.post(
      '/api/tickets',
      route(ctx, async ({ request }) => {
        const parsed = ticketInputSchema.safeParse(await readJson(request))
        if (!parsed.success) return validationFailed(zodFieldErrors(parsed.error))
        const refErrors = referenceErrors(db.data, parsed.data)
        if (Object.keys(refErrors).length > 0) return validationFailed(refErrors)
        const now = new Date().toISOString()
        const record = {
          id: db.nextId('tkt'),
          ...parsed.data,
          version: 1,
          createdAt: now,
          updatedAt: now,
        }
        db.data.tickets.push(record)
        db.commit()
        return HttpResponse.json(toTicket(db.data, record), { status: 201 })
      }),
    ),

    http.patch(
      '/api/tickets/:id',
      route<{ id: string }>(ctx, async ({ params, request }) => {
        const record = db.data.tickets.find((t) => t.id === params.id)
        if (!record) return notFound('Ticket')
        const parsed = ticketUpdateSchema
          .partial()
          .required({ version: true })
          .safeParse(await readJson(request))
        if (!parsed.success) return validationFailed(zodFieldErrors(parsed.error))
        const { version, ...changes } = parsed.data
        if (version !== record.version) {
          return apiError(409, 'CONFLICT', 'This ticket was changed by someone else.', {
            details: { currentVersion: record.version },
          })
        }
        const refErrors = referenceErrors(db.data, changes)
        if (Object.keys(refErrors).length > 0) return validationFailed(refErrors)
        Object.assign(record, changes, {
          version: record.version + 1,
          updatedAt: new Date().toISOString(),
        })
        db.commit()
        return HttpResponse.json(toTicket(db.data, record))
      }),
    ),

    http.delete(
      '/api/tickets/:id',
      route<{ id: string }>(ctx, ({ params }) => {
        const index = db.data.tickets.findIndex((t) => t.id === params.id)
        if (index === -1) return notFound('Ticket')
        db.data.tickets.splice(index, 1)
        db.commit()
        return new HttpResponse(null, { status: 204 })
      }),
    ),
  ]
}
