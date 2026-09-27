import { http, HttpResponse } from 'msw'
import { eventInputSchema, eventUpdateSchema } from '@/modules/events/schemas'
import type { EventItem } from '@/modules/events/types'
import type { MockContext } from '../context'
import { parseListQuery, runListQuery, type ListDefinition } from '../db/list-engine'
import { eventsWithCounts } from '../db/relations'
import { apiError, notFound, readJson, route, validationFailed, zodFieldErrors } from './http-utils'

export const eventList: ListDefinition<EventItem> = {
  sortFields: {
    name: (e) => e.name,
    startDate: (e) => e.startDate,
    status: (e) => e.status,
    ticketCount: (e) => e.ticketCount,
  },
  defaultSort: 'startDate',
  defaultOrder: 'asc',
  searchFields: (e) => [e.name, e.venue],
  filters: {
    status: (e, v) => e.status === v,
    country: (e, v) => e.country === v,
  },
}

export function eventHandlers(ctx: MockContext) {
  const { db } = ctx
  const withCount = (id: string) => eventsWithCounts(db.data).find((e) => e.id === id)

  return [
    http.get(
      '/api/events',
      route(ctx, ({ request }) => {
        const query = parseListQuery(new URL(request.url).searchParams, eventList)
        return HttpResponse.json(runListQuery(eventsWithCounts(db.data), query, eventList))
      }),
    ),

    http.get(
      '/api/events/:id',
      route<{ id: string }>(ctx, ({ params }) => {
        const event = withCount(params.id)
        return event ? HttpResponse.json(event) : notFound('Event')
      }),
    ),

    http.post(
      '/api/events',
      route(ctx, async ({ request }) => {
        const parsed = eventInputSchema.safeParse(await readJson(request))
        if (!parsed.success) return validationFailed(zodFieldErrors(parsed.error))
        const now = new Date().toISOString()
        const record = {
          id: db.nextId('evt'),
          ...parsed.data,
          version: 1,
          createdAt: now,
          updatedAt: now,
        }
        db.data.events.push(record)
        db.commit()
        return HttpResponse.json(withCount(record.id), { status: 201 })
      }),
    ),

    http.patch(
      '/api/events/:id',
      route<{ id: string }>(ctx, async ({ params, request }) => {
        const record = db.data.events.find((e) => e.id === params.id)
        if (!record) return notFound('Event')
        const parsed = eventUpdateSchema.safeParse(await readJson(request))
        if (!parsed.success) return validationFailed(zodFieldErrors(parsed.error))
        const { version, ...changes } = parsed.data
        if (version !== record.version) {
          return apiError(409, 'CONFLICT', 'This event was changed by someone else.', {
            details: { currentVersion: record.version },
          })
        }
        Object.assign(record, changes, {
          version: record.version + 1,
          updatedAt: new Date().toISOString(),
        })
        db.commit()
        return HttpResponse.json(withCount(record.id))
      }),
    ),

    http.delete(
      '/api/events/:id',
      route<{ id: string }>(ctx, ({ params }) => {
        const event = withCount(params.id)
        if (!event) return notFound('Event')
        // Restrict, never cascade: deleting sellable inventory must be an explicit decision.
        if (event.ticketCount > 0) {
          return apiError(409, 'CONFLICT', `${event.name} still has tickets.`, {
            details: { ticketCount: event.ticketCount },
          })
        }
        db.data.events = db.data.events.filter((e) => e.id !== params.id)
        db.commit()
        return new HttpResponse(null, { status: 204 })
      }),
    ),
  ]
}
