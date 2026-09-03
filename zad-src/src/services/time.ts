/*
  ZAD — time & calendar formatting.
  Western digits with natural Arabic wording, as the product voice requires.
*/

const timeFmtCache = new Map<string, Intl.DateTimeFormat>()

function fmt(localeAndExt: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = localeAndExt + JSON.stringify(options)
  let f = timeFmtCache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(localeAndExt, options)
    timeFmtCache.set(key, f)
  }
  return f
}

/** "7:42 م" */
export function formatTime(d: Date, tz: string): string {
  return fmt('ar-EG-u-nu-latn', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

/** "الأربعاء" */
export function formatWeekday(d: Date, tz: string): string {
  return fmt('ar-EG-u-nu-latn', { timeZone: tz, weekday: 'long' }).format(d)
}

/** "19 ربيع الأول 1448" */
export function formatHijri(d: Date, tz: string): string {
  return fmt('ar-SA-u-ca-islamic-umalqura-nu-latn', {
    timeZone: tz,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/** "3 سبتمبر" — used sparingly in settings/about contexts */
export function formatGregorianDayMonth(d: Date, tz: string): string {
  return fmt('ar-EG-u-nu-latn', { timeZone: tz, day: 'numeric', month: 'long' }).format(d)
}

export interface CityDateParts {
  y: number
  m: number
  d: number
}

/** Calendar date of an instant, in a given IANA timezone. */
export function cityDateOf(tz: string, instant: Date | number): CityDateParts {
  const p = fmt('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value)
  return { y: get('year'), m: get('month'), d: get('day') }
}

/** Calendar weekday (JS getDay convention: 0 = Sunday) of an instant in a timezone. */
export function cityWeekdayOf(tz: string, instant: Date | number): number {
  const p = cityDateOf(tz, instant)
  const utcMidnight = Date.UTC(p.y, p.m - 1, p.d)
  return new Date(utcMidnight).getUTCDay()
}

/** Shift a city calendar date by whole days (UTC arithmetic — no DST traps). */
export function shiftCityDate(p: CityDateParts, days: number): CityDateParts {
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + days))
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}
