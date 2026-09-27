import { setupWorker } from 'msw/browser'
import { createMockContext } from './context'
import { createHandlers } from './handlers'
import { createBrowserStorage } from './storage'

/** Starts the in-browser mock API. Must resolve before the app issues its first request. */
export async function startMockApi(): Promise<void> {
  const fixed = import.meta.env.VITE_MOCK_LATENCY
  const ctx = createMockContext(createBrowserStorage(), fixed === undefined ? null : Number(fixed))
  const worker = setupWorker(...createHandlers(ctx))
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: import.meta.env.PROD,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}
