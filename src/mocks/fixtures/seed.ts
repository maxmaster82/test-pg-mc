import type { Currency } from '@/shared/utils/money'
import type { EventStatus } from '@/modules/events/types'
import type { TicketStatus } from '@/modules/tickets/types'
import type { CategoryRecord, DbData, EventRecord, TicketRecord } from '../db/types'
import { DEMO_USER } from './demo-user'
import { at, createRandom } from './random'

const SEED = 20260927
/** Fixed reference date so generated timestamps never depend on the wall clock. */
const REFERENCE_DATE = Date.UTC(2026, 8, 1, 9, 0, 0) // 2026-09-01T09:00:00Z
const DAY = 86_400_000

const CATEGORY_DEFS: { name: string; description: string; basePrice: number }[] = [
  {
    name: 'General Admission',
    description: 'Standard entry without reserved seating.',
    basePrice: 4500,
  },
  {
    name: 'VIP',
    description: 'Priority entry, lounge access and complimentary drinks.',
    basePrice: 18000,
  },
  {
    name: 'Early Bird',
    description: 'Discounted tickets released before general sale.',
    basePrice: 3200,
  },
  {
    name: 'Backstage Pass',
    description: 'Includes a guided backstage tour and artist meet & greet.',
    basePrice: 29000,
  },
  {
    name: 'Student',
    description: 'Reduced price with a valid student card at the door.',
    basePrice: 2500,
  },
  {
    name: 'Family Pack',
    description: 'Entry for two adults and up to two children.',
    basePrice: 12000,
  },
  { name: 'Reserved Seating', description: 'Numbered seat in the main hall.', basePrice: 7500 },
  { name: 'Press', description: 'Accreditation for journalists and photographers.', basePrice: 0 },
]

const VENUES: { venue: string; country: string; currency: Currency }[] = [
  { venue: 'Accor Arena', country: 'FR', currency: 'EUR' },
  { venue: 'Le Zénith', country: 'FR', currency: 'EUR' },
  { venue: 'O2 Arena', country: 'GB', currency: 'GBP' },
  { venue: 'Royal Albert Hall', country: 'GB', currency: 'GBP' },
  { venue: 'Mercedes-Benz Arena', country: 'DE', currency: 'EUR' },
  { venue: 'Palau Sant Jordi', country: 'ES', currency: 'EUR' },
  { venue: 'Ziggo Dome', country: 'NL', currency: 'EUR' },
  { venue: 'Hallenstadion', country: 'CH', currency: 'CHF' },
  { venue: 'Madison Square Garden', country: 'US', currency: 'USD' },
  { venue: 'Mediolanum Forum', country: 'IT', currency: 'EUR' },
]

const EVENT_PREFIXES = [
  'Summer',
  'Autumn',
  'Winter',
  'Spring',
  'Midnight',
  'Electric',
  'Golden',
  'Northern',
]
const EVENT_KINDS = [
  'Fest',
  'Jazz Nights',
  'Rock Arena',
  'Symphony Gala',
  'Comedy Tour',
  'Tech Summit',
  'Dance Weekend',
  'Food & Wine Expo',
]
const TICKET_VARIANTS = [
  'Standard',
  'Day 1',
  'Day 2',
  'Weekend',
  'Evening',
  'Premium',
  'Last Minute',
  'Group',
]
const TICKET_STATUS_POOL: TicketStatus[] = [
  'on_sale',
  'on_sale',
  'on_sale',
  'draft',
  'paused',
  'sold_out',
]

const iso = (ms: number) => new Date(ms).toISOString()
const pad = (n: number, width: number) => String(n).padStart(width, '0')

export const SEED_COUNTS = { categories: 8, events: 24, tickets: 250 } as const

/** Builds the full demo dataset. Pure and deterministic: equal output on every call. */
export function createSeedData(): DbData {
  const random = createRandom(SEED)

  const categories: CategoryRecord[] = CATEGORY_DEFS.map((def, index) => {
    const createdAt = REFERENCE_DATE - (200 - index * 3) * DAY
    return {
      id: `cat_${pad(index + 1, 2)}`,
      name: def.name,
      description: def.description,
      version: 1,
      createdAt: iso(createdAt),
      updatedAt: iso(createdAt + random.int(0, 30) * DAY),
    }
  })

  const events: EventRecord[] = Array.from({ length: SEED_COUNTS.events }, (_, index) => {
    const place = at(VENUES, index % VENUES.length)
    // (prefix, kind) pairs are unique for the first 64 events, so names never collide.
    const prefix = at(EVENT_PREFIXES, index % EVENT_PREFIXES.length)
    const kind = at(
      EVENT_KINDS,
      (index + Math.floor(index / EVENT_PREFIXES.length)) % EVENT_KINDS.length,
    )
    const name = `${prefix} ${kind} ${2026 + Math.floor(index / 16)}`
    // Evening starts: 16:00–19:00 UTC (18:00–21:00 in Central Europe), on the half hour.
    const day = Date.UTC(2026, 8, 1) + (index * 11 - 40) * DAY
    const start = day + random.int(16, 19) * 3_600_000 + random.int(0, 1) * 1_800_000
    const end = start + random.int(0, 2) * DAY + random.int(3, 6) * 3_600_000
    let status: EventStatus = 'published'
    if (end < REFERENCE_DATE) status = 'completed'
    else if (index % 9 === 4) status = 'cancelled'
    else if (index >= SEED_COUNTS.events - 5) status = 'draft'
    const createdAt = REFERENCE_DATE - random.int(60, 160) * DAY
    return {
      id: `evt_${pad(index + 1, 3)}`,
      name,
      country: place.country,
      venue: place.venue,
      startDate: iso(start),
      endDate: iso(end),
      status,
      version: 1,
      createdAt: iso(createdAt),
      updatedAt: iso(createdAt + random.int(0, 40) * DAY),
    }
  })

  // The last three (draft) events and the "Press" category start without tickets,
  // so both successful and refused deletions can be demonstrated.
  const ticketEvents = events.slice(0, SEED_COUNTS.events - 3)
  const ticketCategories = categories.slice(0, -1)

  const tickets: TicketRecord[] = Array.from({ length: SEED_COUNTS.tickets }, (_, index) => {
    const event = at(ticketEvents, index % ticketEvents.length)
    const categoryIndex = random.int(0, ticketCategories.length - 1)
    const category = at(ticketCategories, categoryIndex)
    const def = at(CATEGORY_DEFS, categoryIndex)
    const place = at(
      VENUES,
      VENUES.findIndex((v) => v.venue === event.venue),
    )
    const status = random.pick(TICKET_STATUS_POOL)
    let quantity = random.int(0, 12) * 50
    if (status === 'sold_out') quantity = 0
    if (status === 'on_sale' && quantity === 0) quantity = 100
    const price = Math.round((def.basePrice * (0.8 + random.next() * 0.6)) / 50) * 50
    const createdAt = Date.parse(event.createdAt) + random.int(1, 30) * DAY
    return {
      id: `tkt_${pad(index + 1, 4)}`,
      name: `${category.name} – ${random.pick(TICKET_VARIANTS)}`,
      price,
      currency: place.currency,
      quantity,
      status,
      eventId: event.id,
      categoryId: category.id,
      version: 1,
      createdAt: iso(createdAt),
      updatedAt: iso(createdAt + random.int(0, 60) * DAY + index * 60_000),
    }
  })

  return {
    users: [DEMO_USER],
    sessions: [],
    categories,
    events,
    tickets,
    sequence: 1000,
  }
}
