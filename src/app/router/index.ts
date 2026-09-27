import { createRouter, createWebHistory, type RouterHistory, type RouteRecordRaw } from 'vue-router'
import AppLayout from '@/app/layouts/AppLayout.vue'
import NotFoundPage from '@/app/pages/NotFoundPage.vue'
import OverviewPage from '@/app/pages/OverviewPage.vue'
import { authRoutes } from '@/modules/auth/routes'
import { categoryRoutes } from '@/modules/categories/routes'
import { eventRoutes } from '@/modules/events/routes'
import { ticketRoutes } from '@/modules/tickets/routes'
import { requestHeadingFocus } from '@/shared/composables/route-focus'
import { APP_NAME } from './meta'

export const routes: RouteRecordRaw[] = [
  ...authRoutes,
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'overview',
        component: OverviewPage,
        meta: { title: 'Overview', section: 'overview' },
      },
      ...ticketRoutes,
      ...eventRoutes,
      ...categoryRoutes,
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
    meta: { title: 'Page not found' },
  },
]

export function createAppRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  })

  router.afterEach((to, from, failure) => {
    if (failure) return
    document.title = to.meta.title ? `${to.meta.title} · ${APP_NAME}` : APP_NAME
    // Only for real page changes: filter/sort/page updates keep focus where the user is.
    if (from.matched.length > 0 && to.path !== from.path) requestHeadingFocus()
  })

  return router
}
