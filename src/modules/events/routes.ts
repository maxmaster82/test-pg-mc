import type { RouteRecordRaw } from 'vue-router'

export const eventRoutes: RouteRecordRaw[] = [
  {
    path: 'events',
    name: 'events',
    component: () => import('./pages/EventsListPage.vue'),
    meta: { title: 'Events', section: 'events' },
  },
  {
    path: 'events/new',
    name: 'event-create',
    component: () => import('./pages/EventCreatePage.vue'),
    meta: { title: 'New event', section: 'events' },
  },
  {
    path: 'events/:id',
    name: 'event-detail',
    component: () => import('./pages/EventDetailPage.vue'),
    props: true,
    meta: { title: 'Event', section: 'events' },
  },
  {
    path: 'events/:id/edit',
    name: 'event-edit',
    component: () => import('./pages/EventEditPage.vue'),
    props: true,
    meta: { title: 'Edit event', section: 'events' },
  },
]
