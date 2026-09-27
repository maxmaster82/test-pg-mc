import { mockContext } from '@/mocks/node'
import { useAuthenticatedApi } from '@/test/api-session'
import { ticketsApi } from '../../api'

useAuthenticatedApi()

describe('bulk status API (mock backend contract)', () => {
  it('updates tickets and reports per-ticket failures', async () => {
    const [a, b] = mockContext.db.data.tickets
    Object.assign(a!, { quantity: 10, status: 'draft' })
    Object.assign(b!, { quantity: 0, status: 'paused' })
    const result = await ticketsApi.bulkUpdateStatus({
      ids: [a!.id, b!.id, 'tkt_missing'],
      status: 'on_sale',
    })
    expect(result.updated).toEqual([
      expect.objectContaining({ id: a!.id, status: 'on_sale', version: 2 }),
    ])
    expect(result.failed).toEqual([
      { id: b!.id, code: 'OUT_OF_STOCK', message: 'Out of stock' },
      { id: 'tkt_missing', code: 'NOT_FOUND', message: 'Ticket no longer exists' },
    ])
    expect(b!.status).toBe('paused')
  })

  it('rejects empty and oversized requests', async () => {
    await expect(ticketsApi.bulkUpdateStatus({ ids: [], status: 'paused' })).rejects.toMatchObject({
      status: 422,
    })
    const ids = mockContext.db.data.tickets.slice(0, 101).map((t) => t.id)
    await expect(ticketsApi.bulkUpdateStatus({ ids, status: 'paused' })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { ids: 'Select up to 100 tickets' },
    })
  })
})
