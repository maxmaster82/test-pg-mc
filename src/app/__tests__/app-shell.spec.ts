import { screen, waitFor, within } from '@testing-library/vue'
import { renderApp } from '@/test/render'
import { setViewportWidth } from '@/test/match-media'

describe('application shell', () => {
  it('marks the current section in the primary navigation', async () => {
    await renderApp('/')
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'Tickets' })).not.toHaveAttribute('aria-current')
  })

  it('offers a skip link that moves focus to the main region', async () => {
    const { user } = await renderApp('/')
    await user.tab()
    const skip = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skip).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('sets the document title per route', async () => {
    await renderApp('/')
    expect(document.title).toBe('Overview · Ticket Admin')
  })

  it('renders a not-found page with a way back', async () => {
    await renderApp('/does-not-exist')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to overview' })).toHaveAttribute('href', '/')
  })

  it('uses a two-column layout only when the sidebar is rendered', async () => {
    await renderApp('/')
    const main = screen.getByRole('main')
    const shell = main.parentElement!.parentElement!
    expect(shell).toHaveClass('grid')
    expect(screen.getByRole('navigation', { name: 'Primary' }).closest('aside')).toBeInTheDocument()
  })

  describe('below 1024px', () => {
    it('does not reserve a sidebar column', async () => {
      setViewportWidth(1023)
      await renderApp('/')
      expect(screen.getByRole('main').parentElement!.parentElement).not.toHaveClass('grid')
    })

    beforeEach(() => {
      setViewportWidth(390)
    })

    it('uses a navigation drawer that traps focus and restores it on Escape', async () => {
      const { user } = await renderApp('/')
      expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument()
      const openButton = screen.getByRole('button', { name: 'Open navigation' })
      await user.click(openButton)
      const drawer = await screen.findByRole('dialog')
      expect(within(drawer).getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
      await waitFor(() => {
        expect(drawer).toContainElement(document.activeElement as HTMLElement)
      })
      await user.keyboard('{Escape}')
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
      expect(openButton).toHaveFocus()
    })

    it('closes the drawer after navigating', async () => {
      const { user, router } = await renderApp('/')
      await user.click(screen.getByRole('button', { name: 'Open navigation' }))
      const drawer = await screen.findByRole('dialog')
      await user.click(within(drawer).getByRole('link', { name: 'Categories' }))
      await waitFor(() => {
        expect(router.currentRoute.value.path).toBe('/categories')
      })
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })
})
