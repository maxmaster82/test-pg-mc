import { z } from 'zod'
import { parseMoney } from '@/shared/utils/money'

/** Trimmed text with length bounds and human-readable messages. */
export function requiredText(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`)
}

export function optionalText(label: string, max: number) {
  return z.string().trim().max(max, `${label} must be at most ${max} characters`)
}

/** Decimal money string as typed by the user; transforms to integer minor units. */
export function moneyInput(label: string, maxMinor: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .superRefine((value, ctx) => {
      if (/^\d+[.,]\d{3,}$/.test(value)) {
        ctx.addIssue({ code: 'custom', message: `${label} can have at most 2 decimal places` })
        return
      }
      const minor = parseMoney(value)
      if (minor === null) {
        ctx.addIssue({ code: 'custom', message: `${label} must be a positive number, e.g. 49.90` })
      } else if (minor > maxMinor) {
        ctx.addIssue({ code: 'custom', message: `${label} must be at most ${maxMinor / 100}` })
      }
    })
    .transform((value) => parseMoney(value) ?? 0)
}

/** Whole-number field typed as text (keeps empty input distinguishable from 0). */
export function integerInput(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d+$/, `${label} must be a whole number`)
    .transform(Number)
    .pipe(
      z
        .number()
        .min(min, `${label} must be at least ${min}`)
        .max(max, `${label} must be at most ${max.toLocaleString('en')}`),
    )
}

export function requiredChoice<const T extends readonly [string, ...string[]]>(
  label: string,
  options: T,
) {
  // Input is a plain string (what a <select> produces); output is the narrowed union.
  return z.string().pipe(z.enum(options, { error: `Select a ${label.toLowerCase()}` }))
}

export function requiredId(label: string) {
  return z.string().min(1, `${label} is required`)
}
