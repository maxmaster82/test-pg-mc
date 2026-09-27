import { isoToLocalInput, localInputToIso } from '../dates'
import { COUNTRY_OPTIONS } from '../countries'
import { eventFormSchema, eventInputSchema, toEventFormValues } from '../schemas'
import type { EventItem } from '../types'

const valid = {
  name: 'Autumn Fest',
  venue: 'Le Zénith',
  country: 'FR',
  status: 'published',
  startDate: '2026-10-24T19:30',
  endDate: '2026-10-25T01:00',
}

function firstErrors(values: typeof valid) {
  const result = eventFormSchema.safeParse(values)
  const errors: Record<string, string> = {}
  for (const issue of result.success ? [] : result.error.issues)
    errors[String(issue.path[0])] ??= issue.message
  return errors
}

describe('event dates', () => {
  it('converts local input to UTC across the October DST change (Europe/Paris)', () => {
    expect(localInputToIso('2026-10-24T19:30')).toBe('2026-10-24T17:30:00.000Z') // CEST, UTC+2
    expect(localInputToIso('2026-10-26T19:30')).toBe('2026-10-26T18:30:00.000Z') // CET, UTC+1
  })

  it('round-trips UTC to local input', () => {
    expect(isoToLocalInput('2026-10-24T17:30:00.000Z')).toBe('2026-10-24T19:30')
    expect(isoToLocalInput('2026-01-05T08:05:00.000Z')).toBe('2026-01-05T09:05')
  })

  it('rejects malformed input', () => {
    expect(localInputToIso('24/10/2026 19:30')).toBeNull()
    expect(localInputToIso('')).toBeNull()
  })
})

describe('event schemas', () => {
  it('produces the API shape with UTC dates', () => {
    expect(eventFormSchema.parse(valid)).toEqual({
      ...valid,
      startDate: '2026-10-24T17:30:00.000Z',
      endDate: '2026-10-24T23:00:00.000Z',
    })
  })

  it('requires the end date to be on or after the start date', () => {
    expect(firstErrors({ ...valid, endDate: '2026-10-24T18:00' }).endDate).toBe(
      'End date must be on or after the start date',
    )
    expect(firstErrors({ ...valid, endDate: valid.startDate })).toEqual({})
  })

  it.each([
    ['name', '', 'Name is required'],
    ['venue', 'x', 'Venue must be at least 2 characters'],
    ['country', '', 'Select a country'],
    ['country', 'XX', 'Select a country'],
    ['startDate', '', 'Start date is required'],
  ])('%s = %j → %s', (field, value, message) => {
    expect(firstErrors({ ...valid, [field]: value })[field]).toBe(message)
  })

  it('enforces the same rule in the API schema', () => {
    const result = eventInputSchema.safeParse({
      ...valid,
      startDate: '2026-10-24T17:30:00.000Z',
      endDate: '2026-10-24T10:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('maps an event to form values in local time', () => {
    const event = {
      ...valid,
      startDate: '2026-10-24T17:30:00.000Z',
      endDate: '2026-10-24T23:00:00.000Z',
    } as EventItem
    expect(toEventFormValues(event)).toMatchObject({
      startDate: '2026-10-24T19:30',
      endDate: '2026-10-25T01:00',
    })
  })

  it('offers countries sorted by name', () => {
    const labels = COUNTRY_OPTIONS.map((o) => o.label)
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'en')))
    expect(COUNTRY_OPTIONS).toContainEqual({ value: 'FR', label: 'France' })
  })
})
