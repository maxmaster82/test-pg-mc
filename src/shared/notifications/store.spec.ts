import { createPinia, setActivePinia } from 'pinia'
import { TOAST_DURATION_MS, useNotificationsStore } from './store'

describe('notifications store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('auto-dismisses success after 5 seconds', () => {
    const store = useNotificationsStore()
    store.success('Ticket created')
    expect(store.toasts).toHaveLength(1)
    vi.advanceTimersByTime(TOAST_DURATION_MS)
    expect(store.toasts).toHaveLength(0)
  })

  it('keeps errors until dismissed', () => {
    const store = useNotificationsStore()
    const id = store.error('Could not delete event')!
    vi.advanceTimersByTime(60_000)
    expect(store.toasts).toHaveLength(1)
    store.dismiss(id)
    expect(store.toasts).toHaveLength(0)
  })

  it('deduplicates identical messages within 2 seconds', () => {
    const store = useNotificationsStore()
    store.error('Boom')
    store.error('Boom')
    expect(store.toasts).toHaveLength(1)
    vi.advanceTimersByTime(2001)
    store.error('Boom')
    expect(store.toasts).toHaveLength(2)
  })

  it('shows at most 3 toasts, dropping the oldest', () => {
    const store = useNotificationsStore()
    ;['a', 'b', 'c', 'd'].forEach((m) => store.info(m))
    expect(store.toasts.map((t) => t.message)).toEqual(['b', 'c', 'd'])
  })

  it('pauses and resumes auto-dismiss', () => {
    const store = useNotificationsStore()
    const id = store.success('Saved')!
    vi.advanceTimersByTime(4000)
    store.pause(id)
    vi.advanceTimersByTime(10_000)
    expect(store.toasts).toHaveLength(1)
    store.resume(id)
    vi.advanceTimersByTime(1000)
    expect(store.toasts).toHaveLength(0)
  })
})
