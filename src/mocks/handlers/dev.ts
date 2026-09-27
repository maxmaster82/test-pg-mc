import { http, HttpResponse } from 'msw'
import { FAILURE_MODES, LATENCY_MODES, type MockSettings } from '@/shared/config/mock-settings'
import type { MockContext } from '../context'
import { readJson, route } from './http-utils'

export function devHandlers(ctx: MockContext) {
  const options = { auth: false, failable: false }
  return [
    http.get(
      '/api/__dev/settings',
      route(ctx, () => HttpResponse.json(ctx.settings.current), options),
    ),
    http.put(
      '/api/__dev/settings',
      route(
        ctx,
        async ({ request }) => {
          const body = ((await readJson(request)) ?? {}) as Partial<MockSettings>
          const patch: Partial<MockSettings> = {}
          if (LATENCY_MODES.includes(body.latency as never)) patch.latency = body.latency
          if (FAILURE_MODES.includes(body.failureMode as never))
            patch.failureMode = body.failureMode
          return HttpResponse.json(ctx.settings.update(patch))
        },
        options,
      ),
    ),
    http.post(
      '/api/__dev/reset',
      route(
        ctx,
        () => {
          // Keep active sessions so the current admin stays signed in after a reset.
          const sessions = ctx.db.data.sessions
          ctx.db.reset()
          ctx.db.data.sessions = sessions
          ctx.db.commit()
          return new HttpResponse(null, { status: 204 })
        },
        options,
      ),
    ),
  ]
}
