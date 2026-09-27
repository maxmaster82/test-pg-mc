import { delay, HttpResponse, type HttpResponseResolver, type PathParams } from 'msw'
import type { z } from 'zod'
import type { ApiErrorBody, ApiErrorCode, FieldErrors } from '@/shared/api/types'
import type { MockContext } from '../context'
import type { UserRecord } from '../db/types'

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  extra: { fieldErrors?: FieldErrors; details?: Record<string, unknown> } = {},
) {
  const body: ApiErrorBody = { error: { code, message, ...extra } }
  return HttpResponse.json(body, { status })
}

export const notFound = (entity: string) => apiError(404, 'NOT_FOUND', `${entity} not found.`)

export const validationFailed = (fieldErrors: FieldErrors) =>
  apiError(422, 'VALIDATION_ERROR', 'Some fields are invalid. Please review them.', { fieldErrors })

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_')
    result[key] ??= issue.message
  }
  return result
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export function currentUser(ctx: MockContext, request: Request): UserRecord | null {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const session = ctx.db.data.sessions.find((s) => s.token === token)
  return session ? (ctx.db.data.users.find((u) => u.id === session.userId) ?? null) : null
}

interface RouteOptions {
  /** Require a valid bearer token (default true). */
  auth?: boolean
  /** Subject to simulated failures (default true). */
  failable?: boolean
}

/**
 * Wraps a resolver with simulated network conditions and authentication,
 * so each handler only contains its business logic.
 */
export function route<Params extends PathParams>(
  ctx: MockContext,
  resolver: HttpResponseResolver<Params>,
  options: RouteOptions = {},
): HttpResponseResolver<Params> {
  const { auth = true, failable = true } = options
  return async (info) => {
    const latency = ctx.settings.latencyMs()
    if (latency > 0) await delay(latency)
    if (auth && !currentUser(ctx, info.request)) {
      return apiError(401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.')
    }
    if (failable && ctx.settings.shouldFail()) {
      return apiError(500, 'INTERNAL_ERROR', 'The server encountered an error. Please try again.')
    }
    return resolver(info)
  }
}
