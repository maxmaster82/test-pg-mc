import { createSeedData, SEED_COUNTS } from './seed'

describe('seed data', () => {
  it('is deterministic', () => {
    expect(createSeedData()).toEqual(createSeedData())
  })

  it('has the documented volume', () => {
    const data = createSeedData()
    expect(data.categories).toHaveLength(SEED_COUNTS.categories)
    expect(data.events).toHaveLength(SEED_COUNTS.events)
    expect(data.tickets).toHaveLength(SEED_COUNTS.tickets)
  })

  it('uses unique event and category names (pickers must not be ambiguous)', () => {
    const data = createSeedData()
    expect(new Set(data.events.map((e) => e.name)).size).toBe(data.events.length)
    expect(new Set(data.categories.map((c) => c.name)).size).toBe(data.categories.length)
  })

  it('only references existing events and categories', () => {
    const data = createSeedData()
    const eventIds = new Set(data.events.map((e) => e.id))
    const categoryIds = new Set(data.categories.map((c) => c.id))
    for (const ticket of data.tickets) {
      expect(eventIds.has(ticket.eventId)).toBe(true)
      expect(categoryIds.has(ticket.categoryId)).toBe(true)
    }
  })

  it('includes records useful for demos: unreferenced events/categories and out-of-stock tickets', () => {
    const data = createSeedData()
    const referencedEvents = new Set(data.tickets.map((t) => t.eventId))
    const referencedCategories = new Set(data.tickets.map((t) => t.categoryId))
    expect(data.events.some((e) => !referencedEvents.has(e.id))).toBe(true)
    expect(data.categories.some((c) => !referencedCategories.has(c.id))).toBe(true)
    expect(data.tickets.some((t) => t.quantity === 0 && t.status !== 'sold_out')).toBe(true)
    expect(data.events.every((e) => e.endDate >= e.startDate)).toBe(true)
  })
})
