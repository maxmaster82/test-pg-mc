import { mockContext } from '@/mocks/node'
import { useAuthenticatedApi } from '@/test/api-session'
import { ticketsApi } from '../api'
import type { TicketInput } from '../schemas'

useAuthenticatedApi()

const input: TicketInput = {
  name: 'Integration Pass',
  price: 1500,
  currency: 'EUR',
  quantity: 10,
  status: 'draft',
  eventId: 'evt_001',
  categoryId: 'cat_01',
}

const defaults = { q: '', sort: 'updatedAt', order: 'desc', page: 1, pageSize: 20 } as const

describe('tickets API (mock backend contract)', () => {
  it('lists with pagination meta and embedded relations', async () => {
    const result = await ticketsApi.list({ ...defaults, page: 2 })
    expect(result.meta).toEqual({ page: 2, pageSize: 20, total: 250, totalPages: 13 })
    expect(result.data[0]).toMatchObject({
      event: { id: expect.any(String), name: expect.any(String) },
    })
  })

  it('filters by status, event and category', async () => {
    const result = await ticketsApi.list({
      ...defaults,
      status: 'paused',
      eventId: 'evt_002',
      pageSize: 50,
    })
    expect(result.data.every((t) => t.status === 'paused' && t.eventId === 'evt_002')).toBe(true)
  })

  it('creates with server-managed fields', async () => {
    const ticket = await ticketsApi.create(input)
    expect(ticket).toMatchObject({ ...input, version: 1, event: { id: 'evt_001' } })
    expect(ticket.id).toMatch(/^tkt_/)
    expect(ticket.createdAt).toBe(ticket.updatedAt)
  })

  it('returns 422 with field errors for invalid bodies and unknown references', async () => {
    await expect(ticketsApi.create({ ...input, name: 'x' })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { name: 'Name must be at least 2 characters' },
    })
    await expect(ticketsApi.create({ ...input, eventId: 'evt_missing' })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { eventId: 'Selected event no longer exists' },
    })
  })

  it('updates with optimistic concurrency', async () => {
    const created = await ticketsApi.create(input)
    const updated = await ticketsApi.update(created.id, { ...input, name: 'Renamed', version: 1 })
    expect(updated).toMatchObject({ name: 'Renamed', version: 2 })
    await expect(ticketsApi.update(created.id, { ...input, version: 1 })).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    })
  })

  it('returns 404 for unknown tickets and deletes existing ones', async () => {
    await expect(ticketsApi.get('tkt_missing')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
    await ticketsApi.remove('tkt_0001')
    expect(mockContext.db.data.tickets.some((t) => t.id === 'tkt_0001')).toBe(false)
    await expect(ticketsApi.remove('tkt_0001')).rejects.toMatchObject({ status: 404 })
  })

  it('requires authentication', async () => {
    mockContext.db.data.sessions = []
    await expect(ticketsApi.list(defaults)).rejects.toMatchObject({ status: 401 })
  })

  it('simulates failures when configured', async () => {
    mockContext.settings.update({ failureMode: 'always' })
    await expect(ticketsApi.list(defaults)).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_ERROR',
    })
  })
})
