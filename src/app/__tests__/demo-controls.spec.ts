import { screen, waitFor } from '@testing-library/vue'
import { mockContext } from '@/mocks/node'
import { renderApp } from '@/test/render'

describe('demo controls', () => {
  it('simulates API failures so error states can be demonstrated', async () => {
    const { user, router } = await renderApp('/')
    await user.click(screen.getByRole('button', { name: 'Demo controls' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'Always fail' }))
    await waitFor(() => {
      expect(mockContext.settings.current.failureMode).toBe('always')
    })
    await router.push('/tickets')
    expect(await screen.findByText('Could not load tickets')).toBeInTheDocument()
  })

  it('resets demo data after confirmation and refreshes what is on screen', async () => {
    mockContext.db.data.tickets = []
    const { user } = await renderApp('/tickets')
    expect(await screen.findByText('No tickets yet')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Demo controls' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Reset demo data' }))
    await user.click(await screen.findByRole('button', { name: 'Reset data' }))
    expect(await screen.findByText('Demo data has been reset')).toBeInTheDocument()
    expect(await screen.findByRole('table', { name: 'Tickets' })).toBeInTheDocument()
    // The current administrator stays signed in.
    expect(screen.getByRole('heading', { level: 1, name: 'Tickets' })).toBeInTheDocument()
  })
})
