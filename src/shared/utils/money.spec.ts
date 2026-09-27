import { parseMoney, toDecimalString } from './money'

describe('parseMoney', () => {
  it.each([
    ['0', 0],
    ['12', 1200],
    ['12.5', 1250],
    ['12.05', 1205],
    ['12,50', 1250],
    [' 7.99 ', 799],
    ['100000.00', 10_000_000],
    ['0.1', 10],
  ])('parses %j to %d minor units', (input, expected) => {
    expect(parseMoney(input)).toBe(expected)
  })

  it.each(['', 'abc', '-1', '1.234', '1.', '.5', '1e3', '12.5.1'])('rejects %j', (input) => {
    expect(parseMoney(input)).toBeNull()
  })

  it('avoids floating point drift', () => {
    expect(parseMoney('0.29')).toBe(29) // 0.29 * 100 === 28.999999999999996
  })
})

describe('toDecimalString', () => {
  it.each([
    [0, '0.00'],
    [5, '0.05'],
    [1250, '12.50'],
    [10_000_000, '100000.00'],
  ])('formats %d as %j', (minor, expected) => {
    expect(toDecimalString(minor)).toBe(expected)
  })
})
