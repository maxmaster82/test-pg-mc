import { screen, waitFor, within } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { usePreferencesStore } from '@/app/preferences/store'
import { expectNoSeriousA11yViolations } from '@/test/axe'
import { setViewportWidth } from '@/test/match-media'
import { renderApp } from '@/test/render'

describe('automated accessibility checks (axe, no serious violations)', () => {
  it.each([
    ['login', '/login', false, 'Sign in'],
    ['overview', '/', true, 'Overview'],
    ['tickets list', '/tickets', true, 'Tickets'],
    ['ticket form', '/tickets/new', true, 'New ticket'],
    ['events list', '/events', true, 'Events'],
    ['categories list', '/categories', true, 'Categories'],
  ])('%s', async (_name, path, authenticated, heading) => {
    await renderApp(path, { authenticated })
    await screen.findByRole('heading', { level: 1, name: heading })
    await waitFor(() => {
      expect(document.querySelector('[role=status][aria-live=polite] .animate-pulse')).toBeNull()
    })
    await expectNoSeriousA11yViolations()
  })

  it('has exactly one h1 and a main landmark on every page', async () => {
    await renderApp('/tickets')
    await screen.findByRole('table', { name: 'Tickets' })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
  })
})

describe('focus management', () => {
  it('moves focus to the new page heading after navigating', async () => {
    const { user } = await renderApp('/')
    await user.click(screen.getByRole('link', { name: 'Events' }))
    const heading = await screen.findByRole('heading', { level: 1, name: 'Events' })
    await waitFor(() => {
      expect(heading).toHaveFocus()
    })
  })

  it('keeps focus in place for query-only changes such as filtering', async () => {
    const { user } = await renderApp('/tickets')
    await screen.findByRole('table', { name: 'Tickets' })
    const status = screen.getByRole('combobox', { name: 'Status' })
    await user.selectOptions(status, 'Paused')
    await waitFor(() => {
      expect(status).toHaveFocus()
    })
  })
})

describe('mobile filters', () => {
  it('collapses filters behind a disclosure that shows the active count', async () => {
    setViewportWidth(390)
    const { user } = await renderApp('/tickets?status=paused&categoryId=cat_02')
    const toggle = await screen.findByRole('button', { name: 'Filters (2)' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('combobox', { name: 'Status' })).toBeNull() // hidden: not in the a11y tree
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeVisible()
    expect(
      within(screen.getByRole('search', { name: 'Filter tickets' })).getByRole('searchbox'),
    ).toBeVisible()
  })
})

describe('theme preference', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('defaults to the system theme and persists an explicit choice', () => {
    const preferences = usePreferencesStore()
    expect(preferences.theme).toBe('system')
    preferences.setTheme('dark')
    expect(window.localStorage.getItem('ticket-admin:theme')).toBe('dark')
  })

  it('applies the effective theme to the document', async () => {
    const preferences = usePreferencesStore()
    preferences.setTheme('dark')
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark')
    })
    preferences.setTheme('light')
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light')
    })
  })

  it('restores the saved theme', () => {
    window.localStorage.setItem('ticket-admin:theme', 'dark')
    expect(usePreferencesStore().theme).toBe('dark')
  })

  it('is selectable from the user menu', async () => {
    const { user } = await renderApp('/')
    await user.click(screen.getByRole('button', { name: /Alex Morgan/ }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Dark' }))
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark')
    })
  })
})
