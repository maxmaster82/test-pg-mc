import { screen, waitFor, within } from '@testing-library/vue'
import { http, HttpResponse } from 'msw'
import { mockContext, server } from '@/mocks/node'
import { renderApp } from '@/test/render'

type User = Awaited<ReturnType<typeof renderApp>>['user']

/** Puts five known tickets at the top of the default "last updated" sort. */
function prepareTopTickets({ outOfStock = 0 } = {}) {
  const tickets = mockContext.db.data.tickets.slice(0, 5)
  tickets.forEach((t, i) => {
    Object.assign(t, {
      name: `Bulk Ticket ${i + 1}`,
      status: 'paused',
      quantity: i < outOfStock ? 0 : 100,
      updatedAt: `2030-01-01T00:00:0${9 - i}.000Z`,
    })
  })
  return tickets
}

const rowFor = (name: string) =>
  screen.getByRole('checkbox', { name: `Select ${name}` }).closest('tr') as HTMLElement

async function selectTop(user: User, count: number) {
  for (let i = 1; i <= count; i++)
    await user.click(screen.getByRole('checkbox', { name: `Select Bulk Ticket ${i}` }))
}

async function applyStatus(user: User, label: string) {
  const bar = screen.getByRole('region', { name: 'Bulk actions' })
  await user.selectOptions(within(bar).getByRole('combobox', { name: 'Change status to' }), label)
  await user.click(within(bar).getByRole('button', { name: 'Apply' }))
}

/** Holds the bulk request until release() so the optimistic state can be observed. */
function gateBulkRequest() {
  let release!: () => void
  const gate = new Promise<void>((resolve) => (release = resolve))
  server.use(
    http.post('/api/tickets/bulk-status', async () => {
      await gate
      return undefined // fall through to the real mock handler
    }),
  )
  return () => {
    release()
  }
}

describe('bulk ticket status update', () => {
  it('keeps the selection across pages and shows a mixed header state', async () => {
    prepareTopTickets()
    const { user } = await renderApp('/tickets')
    await screen.findByRole('table', { name: 'Tickets' })
    await selectTop(user, 3)
    const header = screen.getByRole('checkbox', { name: 'Select all tickets on this page' })
    expect(header).toHaveProperty('indeterminate', true)
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('checkbox', { name: 'Select Bulk Ticket 1' }),
      ).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('checkbox', { name: 'Select all tickets on this page' }))
    expect(
      within(screen.getByRole('region', { name: 'Bulk actions' })).getByText('23 selected'),
    ).toBeInTheDocument()
  })

  it('shows the new status immediately, before the server responds', async () => {
    prepareTopTickets()
    const release = gateBulkRequest()
    const { user } = await renderApp('/tickets')
    await screen.findByRole('table', { name: 'Tickets' })
    await selectTop(user, 5)
    await applyStatus(user, 'Draft')
    await waitFor(() => {
      for (let i = 1; i <= 5; i++)
        expect(within(rowFor(`Bulk Ticket ${i}`)).getByText('Draft')).toBeInTheDocument()
    })
    expect(screen.getByRole('table', { name: 'Tickets' })).toHaveAttribute('aria-busy', 'true')
    release()
    expect(await screen.findByText('5 tickets set to Draft.')).toBeInTheDocument()
    expect(mockContext.db.data.tickets.slice(0, 5).every((t) => t.status === 'draft')).toBe(true)
  })

  it('rolls everything back when the request fails', async () => {
    prepareTopTickets()
    server.use(
      http.post('/api/tickets/bulk-status', () =>
        HttpResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Boom' } }, { status: 500 }),
      ),
    )
    const { user } = await renderApp('/tickets')
    await screen.findByRole('table', { name: 'Tickets' })
    await selectTop(user, 5)
    await applyStatus(user, 'Draft')
    expect(
      await screen.findByText('Could not update tickets. No changes were saved.'),
    ).toBeInTheDocument()
    for (let i = 1; i <= 5; i++)
      expect(within(rowFor(`Bulk Ticket ${i}`)).getByText('Paused')).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Bulk actions' })).getByText('5 selected'),
    ).toBeInTheDocument()
  })

  it('reverts only refused tickets on partial failure and keeps them selected', async () => {
    prepareTopTickets({ outOfStock: 2 })
    const { user } = await renderApp('/tickets')
    await screen.findByRole('table', { name: 'Tickets' })
    await selectTop(user, 5)
    await applyStatus(user, 'On sale')
    expect(
      await screen.findByText(
        '3 of 5 tickets updated. 2 tickets could not be put on sale because they are out of stock.',
      ),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(within(rowFor('Bulk Ticket 1')).getByText('Paused')).toBeInTheDocument()
    })
    expect(
      within(rowFor('Bulk Ticket 1')).getByText('Not updated: Out of stock'),
    ).toBeInTheDocument()
    expect(within(rowFor('Bulk Ticket 3')).getByText('On sale')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Select Bulk Ticket 1' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Select Bulk Ticket 3' })).not.toBeChecked()
    expect(
      within(screen.getByRole('region', { name: 'Bulk actions' })).getByText('2 selected'),
    ).toBeInTheDocument()
  })

  it('limits a bulk action to 100 tickets', async () => {
    const { user } = await renderApp('/tickets?pageSize=50')
    await screen.findByRole('table', { name: 'Tickets' })
    for (let page = 0; page < 3; page++) {
      await user.click(screen.getByRole('checkbox', { name: 'Select all tickets on this page' }))
      if (page < 2) {
        await user.click(screen.getByRole('button', { name: 'Next page' }))
        await waitFor(() => {
          expect(
            screen.getByRole('checkbox', { name: 'Select all tickets on this page' }),
          ).not.toBeChecked()
        })
      }
    }
    const bar = screen.getByRole('region', { name: 'Bulk actions' })
    await user.selectOptions(
      within(bar).getByRole('combobox', { name: 'Change status to' }),
      'Draft',
    )
    expect(within(bar).getByText('150 selected')).toBeInTheDocument()
    expect(within(bar).getByRole('button', { name: 'Apply' })).toBeDisabled()
    expect(within(bar).getByRole('button', { name: 'Apply' })).toHaveAccessibleDescription(
      'Select up to 100 tickets',
    )
  })

  it('clears the selection when filters change and announces it', async () => {
    prepareTopTickets()
    const { user } = await renderApp('/tickets')
    await screen.findByRole('table', { name: 'Tickets' })
    await selectTop(user, 2)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'Paused')
    expect(
      await screen.findByText('Selection cleared because the filters changed.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument()
  })

  it('works with the keyboard alone and keeps focus in the bulk bar', async () => {
    prepareTopTickets()
    const { user } = await renderApp('/tickets')
    await screen.findByRole('table', { name: 'Tickets' })
    screen.getByRole('checkbox', { name: 'Select Bulk Ticket 1' }).focus()
    await user.keyboard(' ')
    const bar = screen.getByRole('region', { name: 'Bulk actions' })
    const select = within(bar).getByRole('combobox', { name: 'Change status to' })
    select.focus()
    await user.selectOptions(select, 'Draft')
    const apply = within(bar).getByRole('button', { name: 'Apply' })
    apply.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByText('1 ticket set to Draft.')).toBeInTheDocument()
    expect(bar).toContainElement(document.activeElement as HTMLElement)
  })
})
