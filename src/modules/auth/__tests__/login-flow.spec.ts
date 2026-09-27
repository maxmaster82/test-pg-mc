import { screen, waitFor } from '@testing-library/vue'
import { http, HttpResponse } from 'msw'
import { DEMO_USER } from '@/mocks/fixtures/demo-user'
import { server } from '@/mocks/node'
import { renderApp } from '@/test/render'

async function fillAndSubmit(
  user: Awaited<ReturnType<typeof renderApp>>['user'],
  email: string,
  password: string,
) {
  await user.type(screen.getByLabelText(/Email/), email)
  await user.type(screen.getByLabelText(/Password/), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('login flow', () => {
  it('signs in and lands on the overview', async () => {
    const { user, router } = await renderApp('/login', { authenticated: false })
    expect(document.title).toBe('Sign in · Ticket Admin')
    await fillAndSubmit(user, DEMO_USER.email, DEMO_USER.password)
    await waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/')
    })
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getAllByText(DEMO_USER.name).length).toBeGreaterThan(0)
  })

  it('shows an alert, clears the password and focuses the alert on wrong credentials', async () => {
    const { user } = await renderApp('/login', { authenticated: false })
    await fillAndSubmit(user, DEMO_USER.email, 'wrong-password')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Invalid email or password.')
    await waitFor(() => {
      expect(alert).toHaveFocus()
    })
    expect(screen.getByLabelText(/Password/)).toHaveValue('')
  })

  it('validates empty fields without calling the API and focuses the first invalid field', async () => {
    const onLogin = vi.fn()
    server.use(
      http.post('/api/auth/login', () => {
        onLogin()
        return HttpResponse.json({})
      }),
    )
    const { user } = await renderApp('/login', { authenticated: false })
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toHaveFocus()
    expect(screen.getByLabelText(/Email/)).toHaveAccessibleDescription('Email is required')
    expect(onLogin).not.toHaveBeenCalled()
  })

  it('disables the submit button while signing in', async () => {
    let release!: () => void
    server.use(
      http.post('/api/auth/login', async () => {
        await new Promise<void>((resolve) => (release = resolve))
        return HttpResponse.json(
          { error: { code: 'INVALID_CREDENTIALS', message: 'x' } },
          { status: 401 },
        )
      }),
    )
    const { user } = await renderApp('/login', { authenticated: false })
    await fillAndSubmit(user, DEMO_USER.email, 'x')
    const busy = await screen.findByRole('button', { name: 'Signing in…' })
    expect(busy).toBeDisabled()
    expect(busy).toHaveAttribute('aria-busy', 'true')
    release()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})

describe('route protection', () => {
  it('redirects a signed-out deep link to login and back after signing in', async () => {
    const { user, router } = await renderApp('/?view=compact', { authenticated: false })
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/?view=compact')
    await fillAndSubmit(user, DEMO_USER.email, DEMO_USER.password)
    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/?view=compact')
    })
  })

  it('ignores external redirect targets', async () => {
    const { user, router } = await renderApp('/login?redirect=https://evil.example', {
      authenticated: false,
    })
    await fillAndSubmit(user, DEMO_USER.email, DEMO_USER.password)
    await waitFor(() => {
      expect(router.currentRoute.value.fullPath).toBe('/')
    })
  })

  it('sends signed-in users away from the login page', async () => {
    const { router } = await renderApp('/login')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('keeps the session across a reload', async () => {
    const { router } = await renderApp('/')
    expect(router.currentRoute.value.path).toBe('/')
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
  })

  it('shows the login page when the persisted token is invalid', async () => {
    window.localStorage.setItem('ticket-admin:session-token', 'stale')
    const { router } = await renderApp('/', { authenticated: false })
    expect(router.currentRoute.value.name).toBe('login')
  })
})

describe('logout and expiry', () => {
  it('signs out from the user menu', async () => {
    const { user, router } = await renderApp('/')
    await user.click(screen.getByRole('button', { name: new RegExp(DEMO_USER.name) }))
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }))
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe('login')
    })
    expect(window.localStorage.getItem('ticket-admin:session-token')).toBeNull()
  })

  it('redirects to login with a message when an API call returns 401', async () => {
    const { router } = await renderApp('/')
    server.use(
      http.get('/api/__dev/settings', () =>
        HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Expired' } }, { status: 401 }),
      ),
    )
    const { http: client } = await import('@/shared/api/http')
    await client.get('/__dev/settings').catch(() => undefined)
    await waitFor(() => {
      expect(router.currentRoute.value.name).toBe('login')
    })
    expect(router.currentRoute.value.query).toMatchObject({ redirect: '/', reason: 'expired' })
    expect(
      await screen.findByText('Your session has expired. Please sign in again.'),
    ).toBeInTheDocument()
  })
})
