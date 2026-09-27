import { mockContext } from '@/mocks/node'
import { useAuthenticatedApi } from '@/test/api-session'
import { categoriesApi } from '../api'

useAuthenticatedApi()

describe('categories API (mock backend contract)', () => {
  it('searches name or description case-insensitively', async () => {
    const result = await categoriesApi.list({ q: 'BACKSTAGE' })
    expect(result.data.map((c) => c.name)).toEqual(['Backstage Pass'])
  })

  it('rejects duplicate names case-insensitively, on create and rename', async () => {
    await expect(categoriesApi.create({ name: 'vip', description: '' })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { name: 'A category with this name already exists' },
    })
    const created = await categoriesApi.create({
      name: 'Accessibility',
      description: 'Companion seating',
    })
    await expect(
      categoriesApi.update(created.id, { name: 'VIP', description: '', version: 1 }),
    ).rejects.toMatchObject({
      status: 422,
    })
    await expect(
      categoriesApi.update(created.id, {
        name: 'accessibility',
        description: 'Renamed case only',
        version: 1,
      }),
    ).resolves.toMatchObject({ name: 'accessibility', version: 2 })
  })

  it('validates lengths', async () => {
    await expect(
      categoriesApi.create({ name: 'x'.repeat(61), description: '' }),
    ).rejects.toMatchObject({
      fieldErrors: { name: 'Name must be at most 60 characters' },
    })
    await expect(
      categoriesApi.create({ name: 'Valid', description: 'x'.repeat(501) }),
    ).rejects.toMatchObject({
      fieldErrors: { description: 'Description must be at most 500 characters' },
    })
  })

  it('refuses to delete a category used by tickets and deletes unused ones', async () => {
    await expect(categoriesApi.remove('cat_01')).rejects.toMatchObject({
      status: 409,
      details: { ticketCount: expect.any(Number) },
    })
    await categoriesApi.remove('cat_08') // "Press" has no tickets in the seed
    expect(mockContext.db.data.categories.some((c) => c.id === 'cat_08')).toBe(false)
  })
})
