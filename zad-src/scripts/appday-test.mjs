/*
  ZAD — App Day engine unit checks (run with node against src via tsx-like
  transpile-free subset: we import the adhan lib and replicate computeAppDay
  inputs directly). Verifies the core business rule:
    a ZAD day begins at local Fajr; numbering is sequential; gaps are silent.
*/
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan'

const loc = { lat: 30.04, lng: 31.24, timezone: 'Africa/Cairo' }
const params = CalculationMethod.Egyptian()

function fajrInstant(y, m, d) {
  const probe = new Date(y, m - 1, d, 12, 0)
  return new PrayerTimes(new Coordinates(loc.lat, loc.lng), probe, params).fajr
}
function cityDateOf(instant) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: loc.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant)
  const g = (t) => Number(p.find((x) => x.type === t)?.value)
  return { y: g('year'), m: g('month'), d: g('day') }
}
function shift(p, n) {
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + n))
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}
function computeAppDay(now, journeyStartedAt) {
  const startCity = cityDateOf(journeyStartedAt)
  const startFajr = fajrInstant(startCity.y, startCity.m, startCity.d)
  let anchor = startFajr.getTime() <= journeyStartedAt ? startCity : shift(startCity, -1)
  let day = 1
  let nextDate = shift(anchor, 1)
  let nextFajr = fajrInstant(nextDate.y, nextDate.m, nextDate.d)
  while (nextFajr.getTime() <= now) {
    day += 1
    anchor = nextDate
    nextDate = shift(anchor, 1)
    nextFajr = fajrInstant(nextDate.y, nextDate.m, nextDate.d)
  }
  return { day, nextFajr }
}

const fmt = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { timeZone: 'Africa/Cairo', dateStyle: 'short', timeStyle: 'short' })

let pass = 0, fail = 0
function check(name, cond, extra) {
  if (cond) { pass++; console.log('✓', name, extra ?? '') }
  else { fail++; console.log('✗', name, extra ?? '') }
}

// --- Scenario 1: install mid-day (after Fajr) → that ZAD day is اليوم 1
const install1 = new Date('2026-09-03T14:00:00+03:00') // 2:00 PM Cairo
const r1 = computeAppDay(install1, install1.getTime())
check('install 2PM → اليوم 1', r1.day === 1)

// --- Scenario 2: install before Fajr (3:00 AM) → still اليوم 1, day flips at Fajr
const install2 = new Date('2026-09-03T03:00:00+03:00') // 3:00 AM, Fajr ≈ 5:03
const r2 = computeAppDay(install2, install2.getTime())
check('install 3AM (before Fajr) → اليوم 1', r2.day === 1)
const afterFajr = new Date('2026-09-03T06:00:00+03:00')
const r2b = computeAppDay(afterFajr, install2.getTime())
check('same install after Fajr 6AM → اليوم 2', r2b.day === 2)

// --- Scenario 3: user away for 10 days → day advances, no gaps shown
const tenDaysLater = new Date(install1.getTime() + 10 * 86400000)
const r3 = computeAppDay(tenDaysLater, install1.getTime())
check('away 10 days → اليوم 11', r3.day === 11, `(got ${r3.day})`)

// --- Scenario 4: one minute before Fajr vs at Fajr (boundary)
const day20 = new Date(install1.getTime() + 19 * 86400000) // into يوم 20
const r4 = computeAppDay(day20, install1.getTime())
const beforeBoundary = new Date(r4.nextFajr.getTime() - 60000)
const atBoundary = new Date(r4.nextFajr.getTime())
const r4a = computeAppDay(beforeBoundary, install1.getTime())
const r4b = computeAppDay(atBoundary, install1.getTime())
check('1 min before Fajr = previous day', r4a.day === r4b.day - 1, `(before=${r4a.day}, at=${r4b.day})`)

// --- Scenario 5: DST change (Egypt exits DST last Thursday of October)
const beforeDST = new Date('2026-10-22T12:00:00+03:00') // DST (+3)
const installDST = beforeDST.getTime()
const afterDST = new Date('2026-11-05T12:00:00+02:00')  // standard (+2), 14 days later
const r5 = computeAppDay(afterDST, installDST)
check('across DST exit → 15 days counted', r5.day === 15, `(got ${r5.day})`)

// --- Scenario 6: long absence (1 year) — engine stays fast & correct
const oneYear = new Date(install1.getTime() + 365 * 86400000)
const t0 = performance.now()
const r6 = computeAppDay(oneYear, install1.getTime())
const dt = performance.now() - t0
check('365 days → اليوم 366', r6.day === 366, `(got ${r6.day}, ${dt.toFixed(1)}ms)`)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
