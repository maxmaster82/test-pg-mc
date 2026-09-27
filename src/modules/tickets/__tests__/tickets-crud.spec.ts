import { screen, waitFor, within } from '@testing-library/vue'
import { http, HttpResponse } from 'msw'
import { mockContext, server } from '@/mocks/node'
import { renderApp } from '@/test/render'

type User = Awaited<ReturnType<typeof renderApp>>['user']

/** A seeded event found through server-side search in the Event combobox. */
const jazzEvent = () => mockContext.db.data.events.find((e) => e.name.includes('Jazz'))!

async function chooseEvent(user: User, search: string, option: string) {
  const input = screen.getByRole('combobox', { name: /Event/ })
  await user.click(input)
  await user.type(input, search)
  await user.click(await screen.findByRole('option', { name: option }))
}

async function fillValidTicket(user: User) {
  await user.type(screen.getByRole('textbox', { name: /Name/ }), 'Integration Pass')
  await user.type(screen.getByRole('textbox', { name: /Price/ }), '49.90')
  await user.type(screen.getByRole('textbox', { name: /Quantity/ }), '120')
  await chooseEvent(user, jazzEvent().name.slice(0, 12), jazzEvent().name)
  await screen.findByRole('option', { name: 'VIP' })
  await user.selectOptions(screen.getByRole('combobox', { name: /Category/ }), 'VIP')
}

describe('creating a ticket', () => {
  it('creates a ticket, announces it and shows it on the detail page and list', async () => {
    const { user, router } = await renderApp('/tickets/new')
    await fillValidTicket(user)
    await user.selectOptions(screen.getByRole('combobox', { name: /Status/ }), 'On sale')
    await user.click(screen.getByRole('button', { name: 'Create ticket' }))

    expect(await screen.findByText('Ticket created')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Integration Pass', level: 1 }),
    ).toBeInTheDocument()
    expect(router.currentRoute.value.name).toBe('ticket-detail')
    expect(screen.getByRole('link', { name: jazzEvent().name })).toBeInTheDocument()
    expect(screen.getByText('On sale')).toBeInTheDocument()

    await router.push('/tickets')
    const table = await screen.findByRole('table', { name: 'Tickets' })
    // Default sort is "last updated", so the new ticket is first without a manual refresh.
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Integration Pass')
  })

  it('validates on submit, focuses the first invalid field and sends nothing', async () => {
    const onCreate = vi.fn()
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST' && request.url.endsWith('/api/tickets')) onCreate()
    })
    const { user } = await renderApp('/tickets/new')
    await user.click(screen.getByRole('button', { name: 'Create ticket' }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Price is required')).toBeInTheDocument()
    expect(screen.getByText('Event is required')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveFocus()
    expect(onCreate).not.toHaveBeenCalled()
    server.events.removeAllListeners()
  })

  it('shows a field error on blur for an invalid price', async () => {
    const { user } = await renderApp('/tickets/new')
    const price = screen.getByRole('textbox', { name: /Price/ })
    await user.type(price, '12.345')
    await user.tab()
    expect(await screen.findByText('Price can have at most 2 decimal places')).toBeInTheDocument()
    expect(price).toHaveAttribute('aria-invalid', 'true')
  })

  it('maps server-side validation errors onto fields (event deleted meanwhile)', async () => {
    const { user } = await renderApp('/tickets/new')
    await fillValidTicket(user)
    // Another administrator deletes the event after it was selected.
    const deleted = jazzEvent().id
    mockContext.db.data.events = mockContext.db.data.events.filter((e) => e.id !== deleted)
    await user.click(screen.getByRole('button', { name: 'Create ticket' }))
    expect(await screen.findByText('Selected event no longer exists')).toBeInTheDocument()
    expect(screen.getByText('Some fields need your attention.')).toBeInTheDocument()
  })

  it('keeps entered values when saving fails', async () => {
    server.use(
      http.post('/api/tickets', () =>
        HttpResponse.json(
          {
            error: {
              code: 'INTERNAL_ERROR',
              message: 'The server encountered an error. Please try again.',
            },
          },
          { status: 500 },
        ),
      ),
    )
    const { user } = await renderApp('/tickets/new')
    await fillValidTicket(user)
    await user.click(screen.getByRole('button', { name: 'Create ticket' }))
    expect(
      await screen.findByText('The server encountered an error. Please try again.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('Integration Pass')
    expect(screen.getByRole('textbox', { name: /Price/ })).toHaveValue('49.90')
    expect(screen.getByRole('button', { name: 'Create ticket' })).toBeEnabled()
  })
})

describe('editing a ticket', () => {
  it('prefills the form and saves changes', async () => {
    const { user, router } = await renderApp('/tickets/tkt_0001/edit')
    const name = await screen.findByRole('textbox', { name: /Name/ })
    const original = mockContext.db.data.tickets.find((t) => t.id === 'tkt_0001')!
    expect(name).toHaveValue(original.name)
    expect(screen.getByRole('combobox', { name: /Event/ })).not.toHaveValue('')
    await user.clear(name)
    await user.type(name, 'Renamed Ticket')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Ticket saved')).toBeInTheDocument()
    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/tickets/tkt_0001')
    })
    expect(
      await screen.findByRole('heading', { name: 'Renamed Ticket', level: 1 }),
    ).toBeInTheDocument()
  })

  it('detects a concurrent edit and offers to load the latest version', async () => {
    const { user } = await renderApp('/tickets/tkt_0001/edit')
    const name = await screen.findByRole('textbox', { name: /Name/ })
    // Someone else saves first.
    const record = mockContext.db.data.tickets.find((t) => t.id === 'tkt_0001')!
    Object.assign(record, { name: 'Changed Elsewhere', version: record.version + 1 })

    await user.clear(name)
    await user.type(name, 'My Edit')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('This ticket was changed by someone else.')
    await user.click(within(alert).getByRole('button', { name: 'Load latest version' }))
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('Changed Elsewhere')
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('asks before discarding unsaved changes', async () => {
    const { user, router } = await renderApp('/tickets/tkt_0001/edit')
    await user.type(await screen.findByRole('textbox', { name: /Name/ }), ' (draft)')
    await user.click(screen.getByRole('link', { name: 'Cancel' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Discard unsaved changes?' })
    await user.click(within(dialog).getByRole('button', { name: 'Keep editing' }))
    expect(router.currentRoute.value.name).toBe('ticket-edit')

    await user.click(screen.getByRole('link', { name: 'Cancel' }))
    await user.click(await screen.findByRole('button', { name: 'Discard changes' }))
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe('ticket-detail')
    })
  })

  it('leaves without asking when nothing changed', async () => {
    const { user, router } = await renderApp('/tickets/tkt_0001/edit')
    await screen.findByRole('textbox', { name: /Name/ })
    await user.click(screen.getByRole('link', { name: 'Cancel' }))
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe('ticket-detail')
    })
  })
})

describe('viewing and deleting a ticket', () => {
  it('shows all fields with links to the event and category', async () => {
    await renderApp('/tickets/tkt_0001')
    const ticket = mockContext.db.data.tickets.find((t) => t.id === 'tkt_0001')!
    expect(await screen.findByRole('heading', { name: ticket.name, level: 1 })).toBeInTheDocument()
    const event = mockContext.db.data.events.find((e) => e.id === ticket.eventId)!
    const category = mockContext.db.data.categories.find((c) => c.id === ticket.categoryId)!
    expect(screen.getByRole('link', { name: event.name })).toHaveAttribute(
      'href',
      `/events/${event.id}`,
    )
    expect(screen.getByRole('link', { name: category.name })).toHaveAttribute(
      'href',
      `/categories/${category.id}`,
    )
    for (const term of [
      'Status',
      'Price',
      'Quantity available',
      'Event',
      'Category',
      'Created',
      'Last updated',
    ]) {
      expect(screen.getByText(term)).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/tickets/tkt_0001/edit',
    )
  })

  it('shows a not-found state for unknown tickets', async () => {
    await renderApp('/tickets/does-not-exist')
    expect(await screen.findByText('Ticket not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to tickets' })).toHaveAttribute(
      'href',
      '/tickets',
    )
  })

  it('deletes after confirmation and returns to the list', async () => {
    const { user, router } = await renderApp('/tickets/tkt_0001')
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    await user.click(await screen.findByRole('button', { name: 'Delete ticket' }))
    expect(await screen.findByText('Ticket deleted')).toBeInTheDocument()
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe('tickets')
    })
    expect(mockContext.db.data.tickets.some((t) => t.id === 'tkt_0001')).toBe(false)
  })
})
