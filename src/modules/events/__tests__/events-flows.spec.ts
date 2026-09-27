import { screen, waitFor, within } from '@testing-library/vue'
import { mockContext } from '@/mocks/node'
import { renderApp } from '@/test/render'

const referencedEvent = () =>
  mockContext.db.data.events.find((e) =>
    mockContext.db.data.tickets.some((t) => t.eventId === e.id),
  )!
const unreferencedEvent = () =>
  mockContext.db.data.events.find(
    (e) => !mockContext.db.data.tickets.some((t) => t.eventId === e.id),
  )!

describe('events list', () => {
  it('lists events with sorting by start date and filtering by country', async () => {
    const { user, router } = await renderApp('/events')
    const table = await screen.findByRole('table', { name: 'Events' })
    expect(within(table).getByRole('columnheader', { name: /Starts/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    await user.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'France')
    await waitFor(() => {
      expect(router.currentRoute.value.query).toEqual({ country: 'FR' })
    })
    await waitFor(() => {
      const rows = within(screen.getByRole('table', { name: 'Events' }))
        .getAllByRole('row')
        .slice(1)
      expect(rows.length).toBeGreaterThan(0)
      expect(
        rows.every(
          (r) => r.textContent.includes('Le Zénith') || r.textContent.includes('Accor Arena'),
        ),
      ).toBe(true)
    })
  })
})

describe('event CRUD', () => {
  it('creates an event and shows it', async () => {
    const { user } = await renderApp('/events/new')
    await user.type(screen.getByRole('textbox', { name: /Name/ }), 'Winter Gala 2027')
    await user.type(screen.getByRole('textbox', { name: /Venue/ }), 'Royal Albert Hall')
    await user.selectOptions(screen.getByRole('combobox', { name: /Country/ }), 'United Kingdom')
    await user.type(screen.getByLabelText(/Start date/), '2027-01-15T19:00')
    await user.type(screen.getByLabelText(/End date/), '2027-01-15T23:00')
    await user.click(screen.getByRole('button', { name: 'Create event' }))
    expect(await screen.findByText('Event created')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Winter Gala 2027', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('United Kingdom')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '0 tickets' })).toBeInTheDocument()
  })

  it('blocks an end date before the start date', async () => {
    const { user } = await renderApp('/events/new')
    await user.type(screen.getByLabelText(/Start date/), '2027-01-15T19:00')
    await user.type(screen.getByLabelText(/End date/), '2027-01-14T19:00')
    await user.click(screen.getByRole('button', { name: 'Create event' }))
    expect(
      await screen.findByText('End date must be on or after the start date'),
    ).toBeInTheDocument()
  })

  it('propagates a rename to the tickets list without a manual reload', async () => {
    const event = referencedEvent()
    const { user, router } = await renderApp(`/tickets?eventId=${event.id}`)
    const table = await screen.findByRole('table', { name: 'Tickets' })
    expect(within(table).getAllByText(event.name).length).toBeGreaterThan(0)

    await router.push(`/events/${event.id}/edit`)
    const name = await screen.findByRole('textbox', { name: /Name/ })
    await user.clear(name)
    await user.type(name, 'Renamed Event 2027')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Event saved')).toBeInTheDocument()

    await router.push(`/tickets?eventId=${event.id}`)
    await waitFor(() => {
      const rows = within(screen.getByRole('table', { name: 'Tickets' }))
        .getAllByRole('row')
        .slice(1)
      expect(rows.every((r) => r.textContent.includes('Renamed Event 2027'))).toBe(true)
    })
  })
})

describe('event deletion integrity', () => {
  it('refuses to delete an event with tickets and links to them', async () => {
    const event = referencedEvent()
    const count = mockContext.db.data.tickets.filter((t) => t.eventId === event.id).length
    const { user, router } = await renderApp(`/events/${event.id}`)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    await user.click(await screen.findByRole('button', { name: 'Delete event' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Event cannot be deleted' })
    expect(dialog).toHaveTextContent(
      `${event.name} has ${count} tickets. Delete or move them before deleting the event.`,
    )
    await user.click(within(dialog).getByRole('button', { name: 'View tickets' }))
    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe(`/tickets?eventId=${event.id}`)
    })
    expect(mockContext.db.data.events.some((e) => e.id === event.id)).toBe(true)
  })

  it('deletes an event without tickets', async () => {
    const event = unreferencedEvent()
    const { user, router } = await renderApp(`/events/${event.id}`)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    await user.click(await screen.findByRole('button', { name: 'Delete event' }))
    expect(await screen.findByText('Event deleted')).toBeInTheDocument()
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe('events')
    })
  })
})
