import { screen, waitFor, within } from '@testing-library/vue'
import { mockContext } from '@/mocks/node'
import { renderApp } from '@/test/render'

describe('categories', () => {
  it('lists categories with ticket counts and searches descriptions', async () => {
    const { user } = await renderApp('/categories')
    const table = await screen.findByRole('table', { name: 'Categories' })
    expect(within(table).getAllByRole('row')).toHaveLength(9) // header + 8 seeded
    await user.type(screen.getByRole('searchbox'), 'meet & greet')
    await waitFor(() => {
      const rows = within(screen.getByRole('table', { name: 'Categories' }))
        .getAllByRole('row')
        .slice(1)
      expect(rows.map((r) => within(r).getAllByRole('link')[0]!.textContent.trim())).toEqual([
        'Backstage Pass',
      ])
    })
  })

  it('creates a category that immediately appears in the ticket form', async () => {
    const { user, router } = await renderApp('/categories/new')
    await user.type(screen.getByRole('textbox', { name: /Name/ }), 'Accessibility')
    await user.type(screen.getByRole('textbox', { name: /Description/ }), 'Companion seating')
    await user.click(screen.getByRole('button', { name: 'Create category' }))
    expect(await screen.findByText('Category created')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Accessibility', level: 1 }),
    ).toBeInTheDocument()

    await router.push('/tickets/new')
    expect(await screen.findByRole('option', { name: 'Accessibility' })).toBeInTheDocument()
  })

  it('shows the server duplicate-name error on the field', async () => {
    const { user } = await renderApp('/categories/new')
    await user.type(screen.getByRole('textbox', { name: /Name/ }), 'vip')
    await user.click(screen.getByRole('button', { name: 'Create category' }))
    expect(await screen.findByText('A category with this name already exists')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveAttribute('aria-invalid', 'true')
  })

  it('edits a category', async () => {
    const { user } = await renderApp('/categories/cat_05/edit')
    const description = await screen.findByRole('textbox', { name: /Description/ })
    await user.clear(description)
    await user.type(description, 'Valid student card required.')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Category saved')).toBeInTheDocument()
    expect(await screen.findByText('Valid student card required.')).toBeInTheDocument()
  })

  it('refuses to delete a category used by tickets and explains why', async () => {
    const count = mockContext.db.data.tickets.filter((t) => t.categoryId === 'cat_01').length
    const { user } = await renderApp('/categories/cat_01')
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    await user.click(await screen.findByRole('button', { name: 'Delete category' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Category cannot be deleted' })
    expect(dialog).toHaveTextContent(`General Admission has ${count} tickets.`)
    expect(within(dialog).getByRole('button', { name: 'View tickets' })).toBeInTheDocument()
  })

  it('deletes an unused category from the list', async () => {
    const { user } = await renderApp('/categories')
    await screen.findByRole('table', { name: 'Categories' })
    await user.click(screen.getByRole('button', { name: 'Actions for Press' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await user.click(await screen.findByRole('button', { name: 'Delete category' }))
    expect(await screen.findByText('Category deleted')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Press' })).not.toBeInTheDocument()
    })
  })
})

describe('overview', () => {
  it('shows totals and tickets by status that link to filtered lists', async () => {
    await renderApp('/')
    const onSale = mockContext.db.data.tickets.filter((t) => t.status === 'on_sale').length
    expect(await screen.findByLabelText('250 tickets')).toBeInTheDocument()
    expect(await screen.findByLabelText('24 events')).toBeInTheDocument()
    expect(await screen.findByLabelText('8 categories')).toBeInTheDocument()
    await screen.findByText(String(onSale))
    const onSaleLink = await screen.findByRole('link', { name: new RegExp(`On sale\\s*${onSale}`) })
    expect(onSaleLink).toHaveAttribute('href', '/tickets?status=on_sale')
  })
})
