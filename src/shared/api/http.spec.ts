import { http as mswHttp, HttpResponse } from 'msw'
import { server } from '@/mocks/node'
import { ApiError } from './errors'
import { configureHttp, http } from './http'

describe('http client', () => {
  afterEach(() => {
    configureHttp({ getToken: () => null, onUnauthorized: () => undefined })
  })

  it('serializes query params, skipping empty values, and parses JSON', async () => {
    let seen = ''
    server.use(
      mswHttp.get('/api/things', ({ request }) => {
        seen = new URL(request.url).search
        return HttpResponse.json({ ok: true })
      }),
    )
    await expect(
      http.get('/things', { query: { q: 'vip', page: 2, status: '', x: undefined } }),
    ).resolves.toEqual({ ok: true })
    expect(seen).toBe('?q=vip&page=2')
  })

  it('attaches the bearer token', async () => {
    configureHttp({ getToken: () => 'abc' })
    let auth: string | null = null
    server.use(
      mswHttp.get('/api/me', ({ request }) => {
        auth = request.headers.get('Authorization')
        return HttpResponse.json({})
      }),
    )
    await http.get('/me')
    expect(auth).toBe('Bearer abc')
  })

  it('normalizes the error envelope including field errors', async () => {
    server.use(
      mswHttp.post('/api/things', () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid',
              fieldErrors: { name: 'Required' },
            },
          },
          { status: 422 },
        ),
      ),
    )
    const error = await http.post('/things', {}).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      fieldErrors: { name: 'Required' },
    })
  })

  it('maps 500 and non-JSON bodies to safe errors', async () => {
    server.use(
      mswHttp.get('/api/boom', () => new HttpResponse('<html>Bad gateway</html>', { status: 502 })),
    )
    await expect(http.get('/boom')).rejects.toMatchObject({
      status: 502,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
    })
  })

  it('maps network failures to NETWORK_ERROR', async () => {
    server.use(mswHttp.get('/api/offline', () => HttpResponse.error()))
    await expect(http.get('/offline')).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('rethrows aborts untouched', async () => {
    server.use(mswHttp.get('/api/slow', () => new Promise(() => undefined)))
    const controller = new AbortController()
    const pending = http.get('/slow', { signal: controller.signal })
    controller.abort()
    const error = await pending.catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(ApiError)
    expect((error as Error).name).toBe('AbortError')
  })

  it('calls onUnauthorized once for 401 on authenticated requests', async () => {
    const onUnauthorized = vi.fn()
    configureHttp({ getToken: () => 'expired', onUnauthorized })
    server.use(
      mswHttp.get('/api/secure', () =>
        HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Expired' } }, { status: 401 }),
      ),
    )
    await expect(http.get('/secure')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('does not call onUnauthorized for anonymous requests such as login', async () => {
    const onUnauthorized = vi.fn()
    configureHttp({ onUnauthorized })
    server.use(
      mswHttp.post('/api/auth/login', () =>
        HttpResponse.json(
          { error: { code: 'INVALID_CREDENTIALS', message: 'Nope' } },
          { status: 401 },
        ),
      ),
    )
    await expect(http.post('/auth/login', {})).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
