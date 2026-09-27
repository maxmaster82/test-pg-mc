import 'vue-router'

export type NavSection = 'overview' | 'tickets' | 'events' | 'categories'

declare module 'vue-router' {
  interface RouteMeta {
    /** Used for document.title: "<title> · Ticket Admin". */
    title?: string
    requiresAuth?: boolean
    guestOnly?: boolean
    /** Highlights the matching primary navigation item. */
    section?: NavSection
  }
}

export const APP_NAME = 'Ticket Admin'
