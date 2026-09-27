import { http, HttpResponse } from 'msw'
import { createPinia, setActivePinia } from 'pinia'
import { server } from '@/mocks/node'
import { DEMO_USER } from '@/mocks/fixtures/demo-user'
import { configureHttp } from '@/shared/api/http'
import { signInAsAdmin, TEST_TOKEN } from '@/test/render'
import { useAuthStore } from '../store'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function wireHttp() {
    const auth = useAuthStore()
    configureHttp({ getToken: () => auth.token })
    return auth
  }

  it('logs in and persists the token', async () => {
    const auth = wireHttp()
    await auth.login(DEMO_USER.email, DEMO_USER.password)
    expect(auth.isAuthenticated).toBe(true)
    expect(window.localStorage.getItem('ticket-admin:session-token')).toBe(auth.token)
  })

  it('restores a valid persisted session once', async () => {
    signInAsAdmin()
    const auth = wireHttp()
    expect(auth.token).toBe(TEST_TOKEN)
    await Promise.all([auth.restoreSession(), auth.restoreSession()])
    expect(auth.user?.email).toBe(DEMO_USER.email)
  })

  it('discards a persisted token the API rejects', async () => {
    window.localStorage.setItem('ticket-admin:session-token', 'stale-token')
    const auth = wireHttp()
    await auth.restoreSession()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.token).toBeNull()
    expect(window.localStorage.getItem('ticket-admin:session-token')).toBeNull()
  })

  it('keeps the token when the session check fails for a transient reason', async () => {
    signInAsAdmin()
    server.use(http.get('/api/auth/me', () => HttpResponse.error()))
    const auth = wireHttp()
    await auth.restoreSession()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.token).toBe(TEST_TOKEN)
  })

  it('logout clears local state even if the server call fails', async () => {
    const auth = wireHttp()
    auth.$patch({ token: 'not-a-session', user: { id: 'x', name: 'X', email: 'x@y.z' } })
    await auth.logout()
    expect(auth.isAuthenticated).toBe(false)
  })
})
