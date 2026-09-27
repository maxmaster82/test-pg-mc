import { emptyTicketForm, ticketFormSchema, toTicketFormValues } from '../schemas'
import type { Ticket } from '../types'

const valid = {
  ...emptyTicketForm(),
  name: 'VIP Pass',
  price: '49.90',
  quantity: '100',
  eventId: 'evt_001',
  categoryId: 'cat_01',
}

function errorsFor(values: typeof valid) {
  const result = ticketFormSchema.safeParse(values)
  const errors: Record<string, string> = {}
  // First issue per field wins, matching what the form and the mock API display.
  for (const issue of result.success ? [] : result.error.issues)
    errors[String(issue.path[0])] ??= issue.message
  return errors
}

describe('ticket form schema', () => {
  it('converts valid input to the API shape', () => {
    expect(ticketFormSchema.parse({ ...valid, name: '  VIP Pass  ' })).toEqual({
      name: 'VIP Pass',
      price: 4990,
      currency: 'EUR',
      quantity: 100,
      status: 'draft',
      eventId: 'evt_001',
      categoryId: 'cat_01',
    })
  })

  it.each([
    ['name', 'A', 'Name must be at least 2 characters'],
    ['name', 'x'.repeat(121), 'Name must be at most 120 characters'],
    ['name', '   ', 'Name is required'],
    ['price', '12.345', 'Price can have at most 2 decimal places'],
    ['price', '-1', 'Price must be a positive number, e.g. 49.90'],
    ['price', '100000.01', 'Price must be at most 100000'],
    ['price', '', 'Price is required'],
    ['quantity', '1.5', 'Quantity must be a whole number'],
    ['quantity', '1000001', 'Quantity must be at most 1,000,000'],
    ['eventId', '', 'Event is required'],
    ['categoryId', '', 'Category is required'],
    ['status', 'bogus', 'Select a status'],
  ])('%s = %j → %s', (field, value, message) => {
    expect(errorsFor({ ...valid, [field]: value })[field]).toBe(message)
  })

  it('accepts boundary values', () => {
    expect(errorsFor({ ...valid, name: 'AB', price: '0', quantity: '0' })).toEqual({})
    expect(
      errorsFor({ ...valid, name: 'x'.repeat(120), price: '100000.00', quantity: '1000000' }),
    ).toEqual({})
  })

  it('round-trips a ticket through form values', () => {
    const ticket = {
      id: 't',
      name: 'Gold',
      price: 1205,
      currency: 'GBP',
      quantity: 3,
      status: 'paused',
      eventId: 'e',
      categoryId: 'c',
    } as Ticket
    expect(toTicketFormValues(ticket)).toMatchObject({
      price: '12.05',
      quantity: '3',
      currency: 'GBP',
    })
    expect(ticketFormSchema.parse(toTicketFormValues(ticket)).price).toBe(1205)
  })
})
