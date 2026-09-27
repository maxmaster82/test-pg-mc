import { http, HttpResponse } from 'msw'
import type { LoginResponse, User } from '@/modules/auth/types'
import type { MockContext } from '../context'
import type { UserRecord } from '../db/types'
import { apiError, currentUser, readJson, route } from './http-utils'

const toUser = ({ id, name, email }: UserRecord): User => ({ id, name, email })

function bearer(request: Request): string {
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

export function authHandlers(ctx: MockContext) {
  // Authentication is never subject to simulated failures, so the demo can always sign in.
  return [
    http.post(
      '/api/auth/login',
      route(
        ctx,
        async ({ request }) => {
          const body = (await readJson(request)) as { email?: unknown; password?: unknown } | null
          const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
          const password = typeof body?.password === 'string' ? body.password : ''
          const user = ctx.db.data.users.find((u) => u.email === email && u.password === password)
          if (!user) return apiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.')
          const token = crypto.randomUUID()
          ctx.db.data.sessions.push({ token, userId: user.id })
          ctx.db.commit()
          const response: LoginResponse = { token, user: toUser(user) }
          return HttpResponse.json(response)
        },
        { auth: false, failable: false },
      ),
    ),
    http.get(
      '/api/auth/me',
      route(
        ctx,
        ({ request }) => {
          const user = currentUser(ctx, request)
          return user
            ? HttpResponse.json(toUser(user))
            : apiError(401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.')
        },
        { failable: false },
      ),
    ),
    http.post(
      '/api/auth/logout',
      route(
        ctx,
        ({ request }) => {
          const token = bearer(request)
          ctx.db.data.sessions = ctx.db.data.sessions.filter((s) => s.token !== token)
          ctx.db.commit()
          return new HttpResponse(null, { status: 204 })
        },
        { failable: false },
      ),
    ),
  ]
}
