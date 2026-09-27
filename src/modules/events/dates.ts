/**
 * Event dates are stored as UTC ISO strings and edited with <input type="datetime-local">,
 * which works in the browser's local time without an offset ("2026-10-24T19:30").
 */

const pad = (n: number) => String(n).padStart(2, '0')

/** UTC ISO → local "YYYY-MM-DDTHH:mm" for datetime-local inputs. */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const LOCAL_INPUT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

/** Local "YYYY-MM-DDTHH:mm" → UTC ISO. Returns null for malformed input. */
export function localInputToIso(value: string): string | null {
  if (!LOCAL_INPUT.test(value)) return null
  const [datePart = '', timePart = ''] = value.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  // Constructing from parts is explicitly local time (string parsing rules vary historically).
  const date = new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
