import { formatCountry, formatMoney, formatRange, pluralize } from './format'

describe('format utils', () => {
  it('formats minor units in the given currency', () => {
    expect(formatMoney(1250, 'EUR')).toMatch(/12[.,]50/)
    expect(formatMoney(1250, 'EUR')).toContain('€')
    expect(formatMoney(99, 'USD')).toContain('0.99')
  })

  it('names countries from ISO codes', () => {
    expect(formatCountry('FR')).toBe('France')
    expect(formatCountry('GB')).toBe('United Kingdom')
  })

  it('describes the visible range', () => {
    expect(formatRange(2, 20, 250)).toBe('21–40 of 250')
    expect(formatRange(13, 20, 250)).toBe('241–250 of 250')
    expect(formatRange(1, 20, 0)).toBe('0 results')
  })

  it('pluralizes', () => {
    expect(pluralize(1, 'ticket')).toBe('1 ticket')
    expect(pluralize(12, 'ticket')).toBe('12 tickets')
    expect(pluralize(2, 'category', 'categories')).toBe('2 categories')
  })
})
