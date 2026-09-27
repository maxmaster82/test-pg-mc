import { setupServer } from 'msw/node'
import { createMockContext } from './context'
import { createHandlers } from './handlers'
import { createMemoryStorage } from './storage'

/** Test mock API: zero latency, no persistence. Reset between tests via `mockContext.db.reset()`. */
export const mockContext = createMockContext(createMemoryStorage(), 0)
export const server = setupServer(...createHandlers(mockContext))
