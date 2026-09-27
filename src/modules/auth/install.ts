import type { QueryClient } from '@tanstack/vue-query'
import type { Pinia } from 'pinia'
import type { Router } from 'vue-router'
import { configureHttp } from '@/shared/api/http'
import { useNotificationsStore } from '@/shared/notifications/store'
import { useAuthStore } from './store'

interface AuthDeps {
  pinia: Pinia
  router: Router
  queryClient: QueryClient
}

/** Connects authentication to the HTTP client and the router. Called by the composition root. */
export function installAuth({ pinia, router, queryClient }: AuthDeps) {
  const auth = useAuthStore(pinia)

  configureHttp({
    getToken: () => auth.token,
    onUnauthorized: () => {
      if (!auth.token) return // Already handled by a concurrent 401.
      auth.clear()
      queryClient.clear()
      useNotificationsStore(pinia).clear()
      const current = router.currentRoute.value
      void router.replace({
        name: 'login',
        query: { redirect: current.fullPath, reason: 'expired' },
      })
    },
  })

  router.beforeEach(async (to) => {
    await auth.restoreSession()
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    if (requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }
    }
    if (to.meta.guestOnly && auth.isAuthenticated) return { path: '/' }
    return true
  })
}
