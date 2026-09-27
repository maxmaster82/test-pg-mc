export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const
export type Currency = (typeof CURRENCIES)[number]

const DECIMAL_PATTERN = /^\d+(?:[.,]\d+)?$/

/**
 * Parses a user-entered decimal amount ("12", "12.5", "12,50") into integer minor units.
 * Returns null when the input is not a plain non-negative decimal or has more than 2 decimals.
 * String arithmetic avoids binary floating-point rounding errors.
 */
export function parseMoney(input: string): number | null {
  const value = input.trim()
  if (!DECIMAL_PATTERN.test(value)) return null
  const [whole = '0', fraction = ''] = value.replace(',', '.').split('.')
  if (fraction.length > 2) return null
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}

/** Converts minor units to a plain decimal string suitable for an input field ("1250" → "12.50"). */
export function toDecimalString(minor: number): string {
  const whole = Math.trunc(minor / 100)
  const fraction = String(Math.abs(minor % 100)).padStart(2, '0')
  return `${whole}.${fraction}`
}
