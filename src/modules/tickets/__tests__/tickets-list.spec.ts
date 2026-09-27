import { screen, waitFor, within } from '@testing-library/vue'
import { http, HttpResponse } from 'msw'
import { mockContext, server } from '@/mocks/node'
import { setViewportWidth } from '@/test/match-media'
import { renderApp } from '@/test/render'
import { recordRequests } from '@/test/requests'

const range = () => screen.getByRole('navigation', { name: 'Pagination' })
const rows = () =>
  within(screen.getByRole('table', { name: 'Tickets' }))
    .getAllByRole('row')
    .slice(1)

async function openList(path = '/tickets') {
  const app = await renderApp(path)
  await screen.findByRole('table', { name: 'Tickets' })
  return app
}

describe('tickets list', () => {
  it('shows the first page with range and totals', async () => {
    await openList()
    expect(document.title).toBe('Tickets · Ticket Admin')
    expect(rows()).toHaveLength(20)
    expect(range()).toHaveTextContent('1–20 of 250')
  })

  it('debounces search, resets to page 1 and reflects it in the URL', async () => {
    const { user, router } = await openList('/tickets?page=3')
    const requests = recordRequests('/api/tickets')
    await user.type(screen.getByRole('searchbox', { name: 'Search tickets by name' }), 'vip')
    await waitFor(() => {
      expect(router.currentRoute.value.query).toEqual({ q: 'vip' })
    })
    await waitFor(() => {
      expect(rows().every((row) => /vip/i.test(row.textContent))).toBe(true)
    })
    expect(requests.seen.filter((p) => p.get('q')).map((p) => p.get('q'))).toEqual(['vip'])
    requests.stop()
  })

  it('never shows results of a superseded search', async () => {
    // The response for "v" is held until the newer search for "vip" has rendered.
    let releaseSlow!: () => void
    const slowGate = new Promise<void>((resolve) => (releaseSlow = resolve))
    let slowSettled!: () => void
    const slowDone = new Promise<void>((resolve) => (slowSettled = resolve))
    server.use(
      http.get('/api/tickets', async ({ request }) => {
        if (new URL(request.url).searchParams.get('q') !== 'v') return undefined // fall through
        await slowGate
        slowSettled()
        return HttpResponse.json({
          data: [],
          meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
        })
      }),
    )
    const { user, router } = await openList()
    const search = screen.getByRole('searchbox', { name: 'Search tickets by name' })
    await user.type(search, 'v')
    await waitFor(() => {
      expect(router.currentRoute.value.query).toEqual({ q: 'v' })
    })
    await user.type(search, 'ip')
    await waitFor(() => {
      expect(router.currentRoute.value.query).toEqual({ q: 'vip' })
    })
    await waitFor(() => {
      expect(rows().every((row) => /vip/i.test(row.textContent))).toBe(true)
    })
    releaseSlow()
    await slowDone
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByText('No tickets match your filters')).not.toBeInTheDocument()
    expect(rows().length).toBeGreaterThan(0)
  })

  it('filters by status and resets the page', async () => {
    const { user, router } = await openList('/tickets?page=2')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'Paused')
    await waitFor(() => {
      expect(router.currentRoute.value.query).toEqual({ status: 'paused' })
    })
    await waitFor(() => {
      expect(rows().every((row) => within(row).queryByText('Paused'))).toBe(true)
    })
  })

  it('filters by category', async () => {
    const { user, router } = await openList()
    await screen.findByRole('option', { name: 'VIP' })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'VIP')
    await waitFor(() => {
      expect(router.currentRoute.value.query).toEqual({ categoryId: 'cat_02' })
    })
    await waitFor(() => {
      expect(rows().every((row) => row.textContent.includes('VIP'))).toBe(true)
    })
  })

  it('toggles sorting and exposes aria-sort', async () => {
    const { user, router } = await openList()
    const priceHeader = () => screen.getByRole('columnheader', { name: /Price/ })
    expect(screen.getByRole('columnheader', { name: /Updated/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    await user.click(within(priceHeader()).getByRole('button'))
    await waitFor(() => {
      expect(priceHeader()).toHaveAttribute('aria-sort', 'ascending')
    })
    await user.click(within(priceHeader()).getByRole('button'))
    await waitFor(() => {
      expect(priceHeader()).toHaveAttribute('aria-sort', 'descending')
    })
    // "desc" is the list's default order, so the canonical URL omits it.
    expect(router.currentRoute.value.query).toEqual({ sort: 'price' })
  })

  it('paginates, changes page size and supports the back button', async () => {
    const { user, router } = await openList()
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(() => {
      expect(range()).toHaveTextContent('21–40 of 250')
    })
    expect(router.currentRoute.value.query).toEqual({ page: '2' })
    router.back()
    await waitFor(() => {
      expect(range()).toHaveTextContent('1–20 of 250')
    })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '50')
    await waitFor(() => {
      expect(rows()).toHaveLength(50)
    })
  })

  it('restores state from a shared URL', async () => {
    await openList('/tickets?status=on_sale&sort=price&order=desc&page=2')
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('on_sale')
    expect(screen.getByRole('columnheader', { name: /Price/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    expect(range()).toHaveTextContent(/^21–40 of/)
  })

  it('normalizes invalid URL values to defaults', async () => {
    const { router } = await openList('/tickets?page=abc&status=bogus&pageSize=7')
    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/tickets')
    })
    expect(range()).toHaveTextContent('1–20 of 250')
  })

  it('returns to page 1 when a filtered result set is empty', async () => {
    const { router } = await renderApp('/tickets?q=zzzz&page=4')
    expect(await screen.findByText('No tickets match your filters')).toBeInTheDocument()
    await waitFor(() => {
      expect(router.currentRoute.value.query).toEqual({ q: 'zzzz' })
    })
  })

  it('distinguishes "no matches" from "no data" and can clear filters', async () => {
    const { user, router } = await renderApp('/tickets?q=zzzz')
    expect(await screen.findByText('No tickets match your filters')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]!)
    await screen.findByRole('table', { name: 'Tickets' })
    expect(range()).toHaveTextContent('1–20 of 250')
    expect(router.currentRoute.value.query).toEqual({})
    expect(screen.getByRole('searchbox', { name: 'Search tickets by name' })).toHaveValue('')
  })

  it('shows an empty state with a create action when there are no tickets', async () => {
    mockContext.db.data.tickets = []
    await renderApp('/tickets')
    expect(await screen.findByText('No tickets yet')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'New ticket' }).length).toBeGreaterThan(0)
  })

  it('shows a retryable error state', async () => {
    mockContext.settings.update({ failureMode: 'always' })
    const { user } = await renderApp('/tickets')
    expect(await screen.findByText('Could not load tickets')).toBeInTheDocument()
    mockContext.settings.update({ failureMode: 'none' })
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('table', { name: 'Tickets' })).toBeInTheDocument()
  })

  it('renders cards instead of a table on mobile', async () => {
    setViewportWidth(390)
    await renderApp('/tickets')
    const list = await screen.findByRole('list', { name: 'Tickets' })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    const cards = within(list).getAllByRole('listitem')
    expect(cards).toHaveLength(20)
    const first = within(cards[0]!)
    for (const label of ['Event', 'Price', 'Quantity', 'Status'])
      expect(first.getByText(label)).toBeInTheDocument()
    expect(first.getByRole('button', { name: /Actions for/ })).toBeInTheDocument()
  })
})

describe('deleting from the list', () => {
  async function openActionsForFirstRow(user: Awaited<ReturnType<typeof renderApp>>['user']) {
    const first = rows()[0]!
    const name = within(first).getAllByRole('link')[0]!.textContent.trim()
    const trigger = within(first).getByRole('button', { name: `Actions for ${name}` })
    await user.click(trigger)
    return { name, trigger }
  }

  it('asks for confirmation and removes the ticket', async () => {
    const { user } = await openList()
    const { name } = await openActionsForFirstRow(user)
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete ticket?' })
    expect(dialog).toHaveTextContent(name)
    await user.click(within(dialog).getByRole('button', { name: 'Delete ticket' }))
    expect(await screen.findByText('Ticket deleted')).toBeInTheDocument()
    await waitFor(() => {
      expect(range()).toHaveTextContent('1–20 of 249')
    })
  })

  it('keeps the ticket and restores focus when cancelled with Escape', async () => {
    const { user } = await openList()
    const { trigger } = await openActionsForFirstRow(user)
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await screen.findByRole('alertdialog')
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    await waitFor(() => {
      expect(trigger).toHaveFocus()
    })
    expect(range()).toHaveTextContent('1–20 of 250')
  })

  it('moves to the previous page when the last item of the last page is deleted', async () => {
    mockContext.db.data.tickets = mockContext.db.data.tickets.slice(0, 21)
    const { user, router } = await openList('/tickets?page=2')
    expect(rows()).toHaveLength(1)
    await openActionsForFirstRow(user)
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await user.click(await screen.findByRole('button', { name: 'Delete ticket' }))
    await waitFor(() => {
      expect(router.currentRoute.value.query).toEqual({})
    })
    await waitFor(() => {
      expect(range()).toHaveTextContent('1–20 of 20')
    })
  })
})
