import { safeRedirect } from '../redirect'

describe('safeRedirect', () => {
  it.each([
    ['/tickets?status=on_sale&page=2', '/tickets?status=on_sale&page=2'],
    ['/events/evt_001', '/events/evt_001'],
    ['https://evil.example', '/'],
    ['//evil.example', '/'],
    ['/\\evil.example', '/'],
    ['javascript:alert(1)', '/'],
    [undefined, '/'],
    [['/a'], '/'],
  ])('%j → %j', (input, expected) => {
    expect(safeRedirect(input)).toBe(expected)
  })
})
