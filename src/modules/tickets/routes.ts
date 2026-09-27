import type { RouteRecordRaw } from 'vue-router'

export const ticketRoutes: RouteRecordRaw[] = [
  {
    path: 'tickets',
    name: 'tickets',
    component: () => import('./pages/TicketsListPage.vue'),
    meta: { title: 'Tickets', section: 'tickets' },
  },
  {
    path: 'tickets/new',
    name: 'ticket-create',
    component: () => import('./pages/TicketCreatePage.vue'),
    meta: { title: 'New ticket', section: 'tickets' },
  },
  {
    path: 'tickets/:id',
    name: 'ticket-detail',
    component: () => import('./pages/TicketDetailPage.vue'),
    props: true,
    meta: { title: 'Ticket', section: 'tickets' },
  },
  {
    path: 'tickets/:id/edit',
    name: 'ticket-edit',
    component: () => import('./pages/TicketEditPage.vue'),
    props: true,
    meta: { title: 'Edit ticket', section: 'tickets' },
  },
]
