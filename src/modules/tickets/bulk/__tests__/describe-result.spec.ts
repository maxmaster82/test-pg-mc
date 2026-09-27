import type { Ticket } from '../../types'
import { describeBulkResult } from '../describe-result'

const updated = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `t${i}` }) as Ticket)
const outOfStock = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `f${i}`,
    code: 'OUT_OF_STOCK' as const,
    message: 'Out of stock',
  }))

describe('describeBulkResult', () => {
  it('describes a full success', () => {
    expect(describeBulkResult({ updated: updated(5), failed: [] }, 'paused')).toBe(
      '5 tickets set to Paused.',
    )
    expect(describeBulkResult({ updated: updated(1), failed: [] }, 'on_sale')).toBe(
      '1 ticket set to On sale.',
    )
  })

  it('describes a partial failure with reasons', () => {
    expect(describeBulkResult({ updated: updated(3), failed: outOfStock(2) }, 'on_sale')).toBe(
      '3 of 5 tickets updated. 2 tickets could not be put on sale because they are out of stock.',
    )
  })

  it('describes when nothing was updated', () => {
    expect(
      describeBulkResult(
        {
          updated: [],
          failed: [...outOfStock(1), { id: 'x', code: 'NOT_FOUND', message: 'Gone' }],
        },
        'on_sale',
      ),
    ).toBe(
      'None of the 2 tickets were updated. 1 ticket could not be put on sale because it is out of stock. 1 ticket no longer exists.',
    )
  })
})
