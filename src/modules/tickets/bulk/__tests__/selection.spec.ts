import type { Ticket } from '../../types'
import { useTicketSelection } from '../useTicketSelection'

const t = (id: string) => ({ id, name: id }) as Ticket
const page1 = [t('a'), t('b'), t('c')]
const page2 = [t('d'), t('e')]

describe('useTicketSelection', () => {
  it('toggles rows and reports the page state', () => {
    const s = useTicketSelection()
    expect(s.pageState(page1)).toBe('none')
    s.toggle(page1[0]!)
    expect(s.pageState(page1)).toBe('some')
    s.toggle(page1[0]!)
    expect(s.count.value).toBe(0)
  })

  it('selects and clears a whole page', () => {
    const s = useTicketSelection()
    s.toggle(page1[0]!)
    s.togglePage(page1) // some → all
    expect(s.pageState(page1)).toBe('all')
    s.togglePage(page1) // all → none
    expect(s.count.value).toBe(0)
  })

  it('keeps selections across pages', () => {
    const s = useTicketSelection()
    s.togglePage(page1)
    s.toggle(page2[1]!)
    expect(s.count.value).toBe(4)
    expect(s.pageState(page2)).toBe('some')
  })

  it('keeps only the given ids and clears', () => {
    const s = useTicketSelection()
    s.togglePage(page1)
    s.keepOnly(['b', 'zzz'])
    expect(s.ids.value).toEqual(['b'])
    s.clear()
    expect(s.count.value).toBe(0)
  })
})
