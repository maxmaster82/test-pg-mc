import { mockContext } from '@/mocks/node'
import { useAuthenticatedApi } from '@/test/api-session'
import { eventsApi } from '../api'
import type { EventInput } from '../schemas'

useAuthenticatedApi()

const input: EventInput = {
  name: 'Contract Test Fest',
  venue: 'Test Hall',
  country: 'FR',
  status: 'draft',
  startDate: '2027-01-10T18:00:00.000Z',
  endDate: '2027-01-10T23:00:00.000Z',
}

const referenced = () =>
  mockContext.db.data.events.find((e) =>
    mockContext.db.data.tickets.some((t) => t.eventId === e.id),
  )!
const unreferenced = () =>
  mockContext.db.data.events.find(
    (e) => !mockContext.db.data.tickets.some((t) => t.eventId === e.id),
  )!

describe('events API (mock backend contract)', () => {
  it('searches name or venue and filters by country and status', async () => {
    const byVenue = await eventsApi.list({ q: 'zénith', pageSize: 50 })
    expect(byVenue.data.length).toBeGreaterThan(0)
    expect(byVenue.data.every((e) => e.venue === 'Le Zénith')).toBe(true)
    const french = await eventsApi.list({
      country: 'FR',
      status: 'published',
      page: 1,
      pageSize: 50,
      q: '',
      sort: 'startDate',
      order: 'asc',
    })
    expect(french.data.every((e) => e.country === 'FR' && e.status === 'published')).toBe(true)
  })

  it('returns ticket counts', async () => {
    const event = await eventsApi.get(referenced().id)
    expect(event.ticketCount).toBe(
      mockContext.db.data.tickets.filter((t) => t.eventId === event.id).length,
    )
  })

  it('creates, updates with version check, and rejects end before start', async () => {
    const created = await eventsApi.create(input)
    expect(created).toMatchObject({ ...input, version: 1, ticketCount: 0 })
    await expect(
      eventsApi.update(created.id, { ...input, name: 'Renamed', version: 1 }),
    ).resolves.toMatchObject({ version: 2 })
    await expect(eventsApi.update(created.id, { ...input, version: 1 })).rejects.toMatchObject({
      status: 409,
    })
    await expect(
      eventsApi.create({ ...input, endDate: '2027-01-09T00:00:00.000Z' }),
    ).rejects.toMatchObject({
      status: 422,
      fieldErrors: { endDate: 'End date must be on or after the start date' },
    })
  })

  it('refuses to delete an event that has tickets (409 with count), deletes otherwise', async () => {
    const event = referenced()
    const count = mockContext.db.data.tickets.filter((t) => t.eventId === event.id).length
    await expect(eventsApi.remove(event.id)).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
      details: { ticketCount: count },
    })
    const free = unreferenced()
    await eventsApi.remove(free.id)
    expect(mockContext.db.data.events.some((e) => e.id === free.id)).toBe(false)
  })
})
