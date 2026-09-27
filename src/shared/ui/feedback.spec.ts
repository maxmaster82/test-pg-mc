import { screen, waitFor } from '@testing-library/vue'
import { useNotify } from '@/shared/notifications/store'
import { confirm } from '@/shared/ui/confirm'
import { renderApp } from '@/test/render'

describe('toasts', () => {
  it('announces success politely and errors assertively without moving focus', async () => {
    await renderApp('/')
    const notify = useNotify()
    const before = document.activeElement
    notify.success('Ticket created')
    notify.error('Could not delete event')
    const polite = await screen.findByTestId('toasts-polite')
    const assertive = screen.getByTestId('toasts-assertive')
    expect(polite).toHaveAttribute('aria-live', 'polite')
    expect(polite).toHaveTextContent('Ticket created')
    expect(assertive).toHaveAttribute('aria-live', 'assertive')
    expect(assertive).toHaveTextContent('Could not delete event')
    expect(document.activeElement).toBe(before)
  })

  it('can be dismissed', async () => {
    const { user } = await renderApp('/')
    useNotify().error('Could not delete event')
    await user.click(await screen.findByRole('button', { name: 'Dismiss notification' }))
    expect(screen.queryByText('Could not delete event')).not.toBeInTheDocument()
  })
})

describe('confirm dialog', () => {
  it('focuses Cancel first and resolves false on Escape', async () => {
    const { user } = await renderApp('/')
    const result = confirm({
      title: 'Delete ticket?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    })
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete ticket?' })
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    })
    await user.keyboard('{Escape}')
    await expect(result).resolves.toBe(false)
  })

  it('resolves true when confirmed', async () => {
    const { user } = await renderApp('/')
    const result = confirm({ title: 'Delete ticket?', message: 'Sure?', confirmLabel: 'Delete' })
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    await expect(result).resolves.toBe(true)
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })
})
