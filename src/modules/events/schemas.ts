import { z } from 'zod'
import { requiredChoice, requiredText } from '@/shared/validation/rules'
import { COUNTRY_CODES } from './countries'
import { isoToLocalInput, localInputToIso } from './dates'
import { EVENT_STATUSES, type EventItem } from './types'

const END_BEFORE_START = 'End date must be on or after the start date'

const baseFields = {
  name: requiredText('Name', 2, 120),
  venue: requiredText('Venue', 2, 120),
  country: requiredChoice('Country', COUNTRY_CODES),
  status: requiredChoice('Status', EVENT_STATUSES),
}

/** API contract for create/update bodies. Also enforced by the mock API. */
export const eventInputSchema = z
  .object({
    ...baseFields,
    startDate: z.iso.datetime({ error: 'Start date is required' }),
    endDate: z.iso.datetime({ error: 'End date is required' }),
  })
  .refine((e) => e.endDate >= e.startDate, { path: ['endDate'], error: END_BEFORE_START })
export type EventInput = z.output<typeof eventInputSchema>

export const eventUpdateSchema = eventInputSchema.safeExtend({ version: z.number().int().min(1) })
export type EventUpdate = z.output<typeof eventUpdateSchema>

function localDate(label: string) {
  return z
    .string()
    .min(1, `${label} is required`)
    .transform((value, ctx) => {
      const iso = localInputToIso(value)
      if (!iso) {
        ctx.addIssue({ code: 'custom', message: `Enter a valid ${label.toLowerCase()}` })
        return z.NEVER
      }
      return iso
    })
}

/** Run the date-order check as soon as both dates are valid, even if other fields are not yet. */
const datesAreValid = (payload: z.core.ParsePayload) =>
  payload.issues.every((issue) => issue.path?.[0] !== 'startDate' && issue.path?.[0] !== 'endDate')

export const eventFormSchema = z
  .object({ ...baseFields, startDate: localDate('Start date'), endDate: localDate('End date') })
  .refine((e) => e.endDate >= e.startDate, {
    path: ['endDate'],
    error: END_BEFORE_START,
    when: datesAreValid,
  })

export type EventFormValues = z.input<typeof eventFormSchema>

export const emptyEventForm = (): EventFormValues => ({
  name: '',
  venue: '',
  country: '',
  status: 'draft',
  startDate: '',
  endDate: '',
})

export function toEventFormValues(event: EventItem): EventFormValues {
  return {
    name: event.name,
    venue: event.venue,
    country: event.country,
    status: event.status,
    startDate: isoToLocalInput(event.startDate),
    endDate: isoToLocalInput(event.endDate),
  }
}
