import { parseListQuery, runListQuery, type ListDefinition } from './list-engine'

interface Item {
  id: string
  name: string
  price: number
  status: string
}

const items: Item[] = Array.from({ length: 25 }, (_, i) => ({
  id: `it_${String(i + 1).padStart(2, '0')}`,
  name: i % 5 === 0 ? `VIP pass ${i}` : `Standard ${i}`,
  price: i % 3 === 0 ? 1000 : 500 + i,
  status: i % 2 === 0 ? 'on_sale' : 'draft',
}))

const definition: ListDefinition<Item> = {
  sortFields: { name: (i) => i.name, price: (i) => i.price },
  defaultSort: 'name',
  defaultOrder: 'asc',
  searchFields: (i) => [i.name],
  filters: { status: (i, v) => i.status === v },
}

const list = (qs: string) =>
  runListQuery(items, parseListQuery(new URLSearchParams(qs), definition), definition)

describe('list engine', () => {
  it('paginates with meta', () => {
    const result = list('page=2&pageSize=10')
    expect(result.data).toHaveLength(10)
    expect(result.meta).toEqual({ page: 2, pageSize: 10, total: 25, totalPages: 3 })
  })

  it('falls back to defaults for invalid values', () => {
    const query = parseListQuery(
      new URLSearchParams('page=-3&pageSize=999&sort=unknown&order=up'),
      definition,
    )
    expect(query).toMatchObject({ page: 1, pageSize: 20, sort: 'name', order: 'asc' })
  })

  it('returns an empty page beyond range with correct totals', () => {
    const result = list('page=5&pageSize=20')
    expect(result.data).toEqual([])
    expect(result.meta.totalPages).toBe(2)
  })

  it('searches case-insensitively', () => {
    const result = list('q=vip')
    expect(result.meta.total).toBe(5)
    expect(result.data.every((i) => i.name.startsWith('VIP'))).toBe(true)
  })

  it('applies filters', () => {
    expect(list('status=draft').data.every((i) => i.status === 'draft')).toBe(true)
    expect(list('status=draft').meta.total).toBe(12)
  })

  it('sorts both ways with a stable id tiebreak', () => {
    const asc = list('sort=price&order=asc&pageSize=50').data
    const desc = list('sort=price&order=desc&pageSize=50').data
    expect(asc.map((i) => i.price)).toEqual([...asc.map((i) => i.price)].sort((a, b) => a - b))
    expect(desc[0]!.price).toBe(1000)
    const ties = desc.filter((i) => i.price === 1000).map((i) => i.id)
    expect(ties).toEqual([...ties].sort())
  })

  it('never duplicates or skips items across pages', () => {
    const pages = [1, 2, 3].flatMap((page) => list(`sort=price&pageSize=10&page=${page}`).data)
    expect(new Set(pages.map((i) => i.id)).size).toBe(25)
  })
})
