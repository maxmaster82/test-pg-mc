import { VueQueryPlugin } from '@tanstack/vue-query'
import { render } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import App from '@/app/App.vue'
import { createAppContext } from '@/app/create-app-context'
import { mockContext } from '@/mocks/node'
import { DEMO_USER } from '@/mocks/fixtures/demo-user'

export const TEST_TOKEN = 'test-session-token'

/** Starts a server-side session and stores its token, as if the user had signed in earlier. */
export function signInAsAdmin() {
  mockContext.db.data.sessions.push({ token: TEST_TOKEN, userId: DEMO_USER.id })
  window.localStorage.setItem('ticket-admin:session-token', TEST_TOKEN)
}

interface RenderAppOptions {
  /** Start with a valid session (default true). */
  authenticated?: boolean
}

/**
 * Renders the whole application at a route with a fresh router, Pinia and QueryClient
 * (retries disabled so failures surface immediately). The mock API is served by MSW.
 */
export async function renderApp(path = '/', { authenticated = true }: RenderAppOptions = {}) {
  if (authenticated) signInAsAdmin()
  const { pinia, router, queryClient } = createAppContext(createMemoryHistory())
  setActivePinia(pinia)
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
    mutations: { retry: false },
  })

  await router.push(path)
  await router.isReady()

  const user = userEvent.setup()
  const utils = render(App, {
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return { ...utils, user, router, queryClient, pinia }
}
