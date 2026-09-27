import type { Paginated } from '@/shared/api/types'
import type { Ticket } from '../../types'
import { applyStatus, collectStatuses, mergeTickets, revertStatuses } from '../cache'

const ticket = (id: string, status: Ticket['status']) =>
  ({ id, status, name: id, version: 1 }) as Ticket
const page = (...tickets: Ticket[]): Paginated<Ticket> => ({
  data: tickets,
  meta: { page: 1, pageSize: 20, total: tickets.length, totalPages: 1 },
})

describe('bulk cache transforms', () => {
  const list = page(ticket('a', 'draft'), ticket('b', 'paused'), ticket('c', 'draft'))

  it('applies a status to selected tickets in pages and details', () => {
    const next = applyStatus(list, new Set(['a', 'b']), 'on_sale') as Paginated<Ticket>
    expect(next.data.map((t) => t.status)).toEqual(['on_sale', 'on_sale', 'draft'])
    expect(list.data[0]!.status).toBe('draft') // input untouched
    expect(applyStatus(ticket('a', 'draft'), new Set(['a']), 'paused')).toMatchObject({
      status: 'paused',
    })
    expect(applyStatus(undefined, new Set(['a']), 'paused')).toBeUndefined()
  })

  it('returns the same object when nothing changes', () => {
    expect(applyStatus(list, new Set(['z']), 'on_sale')).toBe(list)
  })

  it('collects previous statuses across cached values', () => {
    const previous = collectStatuses(
      [list, ticket('d', 'sold_out'), undefined],
      new Set(['b', 'd']),
    )
    expect([...previous]).toEqual([
      ['b', 'paused'],
      ['d', 'sold_out'],
    ])
  })

  it('reverts only the given tickets', () => {
    const optimistic = applyStatus(list, new Set(['a', 'b', 'c']), 'on_sale')
    const reverted = revertStatuses(optimistic, new Map([['b', 'paused']])) as Paginated<Ticket>
    expect(reverted.data.map((t) => t.status)).toEqual(['on_sale', 'paused', 'on_sale'])
  })

  it('merges authoritative server copies', () => {
    const merged = mergeTickets(
      list,
      new Map([['c', { ...ticket('c', 'on_sale'), version: 2 }]]),
    ) as Paginated<Ticket>
    expect(merged.data[2]).toMatchObject({ status: 'on_sale', version: 2 })
  })
})
