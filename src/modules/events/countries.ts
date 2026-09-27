import type { SelectOption } from '@/shared/ui/SelectField.vue'
import { formatCountry } from '@/shared/utils/format'

/** Countries offered in the event form and filter (ISO 3166-1 alpha-2). Extend as markets grow. */
export const COUNTRY_CODES = [
  'AR',
  'AT',
  'AU',
  'BE',
  'BR',
  'CA',
  'CH',
  'CZ',
  'DE',
  'DK',
  'ES',
  'FI',
  'FR',
  'GB',
  'GR',
  'HU',
  'IE',
  'IN',
  'IT',
  'JP',
  'KR',
  'MA',
  'MX',
  'NL',
  'NO',
  'NZ',
  'PL',
  'PT',
  'RO',
  'SE',
  'SG',
  'TR',
  'UA',
  'US',
  'ZA',
] as const

export const COUNTRY_OPTIONS: SelectOption[] = COUNTRY_CODES.map((code) => ({
  value: code,
  label: formatCountry(code),
})).sort((a, b) => a.label.localeCompare(b.label, 'en'))
