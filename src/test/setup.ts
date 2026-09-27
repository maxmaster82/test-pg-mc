import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/vue'
import { mockContext, server } from '@/mocks/node'
import { settleConfirm } from '@/shared/ui/confirm'
import { installMatchMedia } from './match-media'

// Deterministic local time for date conversion tests (includes a DST transition).
process.env.TZ = 'Europe/Paris'

installMatchMedia()
// jsdom does not implement scrolling or layout observers used by the router and Reka UI popovers.
window.scrollTo = () => undefined
Element.prototype.scrollIntoView = function scrollIntoView() {}
Element.prototype.hasPointerCapture = () => false
Element.prototype.releasePointerCapture = () => undefined
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  mockContext.db.reset()
  mockContext.settings.update({ latency: 'none', failureMode: 'none' })
  window.localStorage.clear()
})

afterEach(() => {
  // The confirm dialog is an app-wide singleton: an unanswered one must not leak into the next test.
  settleConfirm(false)
  cleanup()
  // Reka UI locks the body (pointer-events/scroll) while a modal is open; never leak it across tests.
  document.body.removeAttribute('style')
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
