import { createPinia } from 'pinia'
import type { RouterHistory } from 'vue-router'
import { installAuth } from '@/modules/auth/install'
import { createAppQueryClient } from './providers/query-client'
import { createAppRouter } from './router'

/** Composition root shared by main.ts and integration tests. */
export function createAppContext(history?: RouterHistory) {
  const pinia = createPinia()
  const router = createAppRouter(history)
  const queryClient = createAppQueryClient()
  installAuth({ pinia, router, queryClient })
  return { pinia, router, queryClient }
}
