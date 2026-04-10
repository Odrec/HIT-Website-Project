/**
 * Event time formatting utilities.
 *
 * HIT is physically in Osnabrück, so event times are always "wall-clock" times
 * in Europe/Berlin. They are stored in PostgreSQL as `timestamp without time
 * zone` — naked wall-clock values — but Prisma reads them back as JS Dates with
 * the UTC suffix (e.g. "2026-11-19T09:00:00.000Z" for an event at 09:00 Berlin).
 *
 * To display these correctly regardless of the viewer's local timezone, we
 * extract the UTC components of the Date object directly. This treats the
 * stored value as "what the clock shows in Osnabrück" rather than as a real
 * UTC instant.
 *
 * Never format these dates with `date.toLocaleString()` or
 * `format(date, 'HH:mm')` from date-fns — both apply the viewer's local TZ.
 */

const MONTHS_DE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
]

const WEEKDAYS_DE_LONG = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
]

const WEEKDAYS_DE_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

const MONTHS_DE_SHORT = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
]

type DateInput = Date | string | number | null | undefined

function toDate(input: DateInput): Date | null {
  if (input == null) return null
  const d = input instanceof Date ? input : new Date(input)
  return isNaN(d.getTime()) ? null : d
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Format as "HH:mm" using the UTC components of the Date (Berlin wall-clock). */
export function formatEventTime(input: DateInput): string {
  const d = toDate(input)
  if (!d) return ''
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`
}

/** Format a time range as "HH:mm - HH:mm". */
export function formatEventTimeRange(start: DateInput, end: DateInput): string {
  const s = formatEventTime(start)
  const e = formatEventTime(end)
  if (!s && !e) return ''
  if (!e) return s
  if (!s) return e
  return `${s} - ${e}`
}

/** Format as "yyyy-MM-dd" from UTC components. Useful for grouping events by date. */
export function formatEventDateKey(input: DateInput): string {
  const d = toDate(input)
  if (!d) return ''
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

/** Format as "Donnerstag, 19. November" (no year). */
export function formatEventDateWeekday(input: DateInput): string {
  const d = toDate(input)
  if (!d) return ''
  return `${WEEKDAYS_DE_LONG[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONTHS_DE[d.getUTCMonth()]}`
}

/** Format as "Donnerstag, 19. November 2026". */
export function formatEventDateLong(input: DateInput): string {
  const d = toDate(input)
  if (!d) return ''
  return `${WEEKDAYS_DE_LONG[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONTHS_DE[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Format as "Do, 19. Nov" (short weekday + month). */
export function formatEventDateShort(input: DateInput): string {
  const d = toDate(input)
  if (!d) return ''
  return `${WEEKDAYS_DE_SHORT[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONTHS_DE_SHORT[d.getUTCMonth()]}`
}

/** Format as "Do, 19. Nov 2026" (short weekday + month + year). */
export function formatEventDateShortYear(input: DateInput): string {
  const d = toDate(input)
  if (!d) return ''
  return `${WEEKDAYS_DE_SHORT[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONTHS_DE_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Format as "19. November 2026". */
export function formatEventDateDMY(input: DateInput): string {
  const d = toDate(input)
  if (!d) return ''
  return `${d.getUTCDate()}. ${MONTHS_DE[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Format as "19.11.2026, 09:00". */
export function formatEventDateTime(input: DateInput): string {
  const d = toDate(input)
  if (!d) return ''
  return `${pad2(d.getUTCDate())}.${pad2(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}, ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`
}

/**
 * Format as iCal local datetime "yyyyMMddTHHmmss" (no Z suffix).
 * iCal files use this with an explicit TZID=Europe/Berlin property.
 */
export function formatEventICalLocal(input: DateInput): string {
  const d = toDate(input)
  if (!d) return ''
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}`
}

/**
 * Compare two event dates by UTC calendar day. Returns true if they fall on
 * the same "Berlin day" (using UTC components of stored wall-clock dates).
 */
export function isSameEventDay(a: DateInput, b: DateInput): boolean {
  const da = toDate(a)
  const db = toDate(b)
  if (!da || !db) return false
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth() &&
    da.getUTCDate() === db.getUTCDate()
  )
}

/**
 * Check if an event falls on a given calendar day selected from a date picker.
 * The picker produces local-midnight Dates; the event has UTC wall-clock
 * components. Compare the picker's LOCAL y/m/d against the event's UTC y/m/d.
 */
export function eventOnPickedDate(eventTime: DateInput, pickedDate: DateInput): boolean {
  const e = toDate(eventTime)
  const p = toDate(pickedDate)
  if (!e || !p) return false
  return (
    e.getUTCFullYear() === p.getFullYear() &&
    e.getUTCMonth() === p.getMonth() &&
    e.getUTCDate() === p.getDate()
  )
}

/**
 * Normalize a picker-selected Date (local-midnight) to a wall-clock Date
 * with matching UTC components. Useful before passing to `formatEventDate*`.
 */
export function pickedDateToEventDate(input: DateInput): Date | null {
  const d = toDate(input)
  if (!d) return null
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}
