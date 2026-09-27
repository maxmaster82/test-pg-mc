import type { Currency } from './money'

const LOCALE = undefined // Use the browser's locale.

const moneyFormatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(minor: number, currency: Currency): string {
  let formatter = moneyFormatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency })
    moneyFormatters.set(currency, formatter)
  }
  return formatter.format(minor / 100)
}

const numberFormatter = new Intl.NumberFormat(LOCALE)
export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' })

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

/** ISO 3166-1 alpha-2 code → English country name ("FR" → "France"). */
export function formatCountry(code: string): string {
  return regionNames.of(code) ?? code
}

/** "21–40 of 250" */
export function formatRange(page: number, pageSize: number, total: number): string {
  if (total === 0) return '0 results'
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return `${formatNumber(start)}–${formatNumber(end)} of ${formatNumber(total)}`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`
}
