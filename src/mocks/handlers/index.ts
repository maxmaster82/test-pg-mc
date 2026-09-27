import type { MockContext } from '../context'
import { authHandlers } from './auth'
import { categoryHandlers } from './categories'
import { devHandlers } from './dev'
import { eventHandlers } from './events'
import { ticketHandlers } from './tickets'

export function createHandlers(ctx: MockContext) {
  return [
    ...devHandlers(ctx),
    ...authHandlers(ctx),
    ...ticketHandlers(ctx),
    ...eventHandlers(ctx),
    ...categoryHandlers(ctx),
  ]
}
