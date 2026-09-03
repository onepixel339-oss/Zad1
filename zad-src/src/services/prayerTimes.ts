/*
  ZAD — prayer time engine (isolated service, per spec).
  Wraps the `adhan` astronomical calculation library. No hardcoding.

  Verified behaviour of adhan-js:
  - PrayerTimes(coords, date, params) reads the *local* y/m/d of `date`
    and returns real instants (UTC-anchored).
  - Passing `new Date(y, m, d, 12, 0)` therefore computes the times for
    the calendar date (y, m, d) correctly on any device timezone.
  - Formatting an instant with Intl timeZone:<location tz> yields the
    wall-clock time of the selected location.
*/

import {
  CalculationMethod,
  Coordinates,
  PrayerTimes as AdhanPrayerTimes,
  type CalculationParameters,
} from 'adhan'
import type { LocationInfo, PrayerKey } from '../types'
import { cityDateOf, shiftCityDate } from './time'

export interface CalcMethodEntry {
  id: string
  label: string
}

/** Calculation methods offered in settings. Egyptian default. */
export const CALC_METHODS: CalcMethodEntry[] = [
  { id: 'egyptian', label: 'الهيئة المصرية العامة للمساحة' },
  { id: 'mwl', label: 'رابطة العالم الإسلامي' },
  { id: 'ummalqura', label: 'أم القرى — مكة المكرمة' },
  { id: 'dubai', label: 'الإمارات — دبي' },
  { id: 'kuwait', label: 'الكويت' },
  { id: 'qatar', label: 'قطر' },
  { id: 'isna', label: 'أمريكا الشمالية — ISNA' },
  { id: 'moonsighting', label: 'لجنة رؤية الهلال' },
]

export const DEFAULT_METHOD = 'egyptian'

export function calcMethodLabel(id: string): string {
  return CALC_METHODS.find((m) => m.id === id)?.label ?? CALC_METHODS[0].label
}

function params(methodId: string): CalculationParameters {
  const m = CalculationMethod
  switch (methodId) {
    case 'mwl':
      return m.MuslimWorldLeague()
    case 'ummalqura':
      return m.UmmAlQura()
    case 'dubai':
      return m.Dubai()
    case 'kuwait':
      return m.Kuwait()
    case 'qatar':
      return m.Qatar()
    case 'isna':
      return m.NorthAmerica()
    case 'moonsighting':
      return m.MoonsightingCommittee()
    case 'egyptian':
    default:
      return m.Egyptian()
  }
}

export interface DayPrayerInstants {
  fajr: Date
  sunrise: Date
  dhuhr: Date
  asr: Date
  maghrib: Date
  isha: Date
}

const PRAYER_ORDER: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

/** Times for a specific location-calendar-date (y, m, d). Returns real instants. */
export function prayerTimesForCityDate(
  loc: LocationInfo,
  methodId: string,
  y: number,
  m: number,
  d: number,
): DayPrayerInstants {
  const coords = new Coordinates(loc.lat, loc.lng)
  // device-local noon → local y/m/d components are exactly (y, m, d)
  const probe = new Date(y, m - 1, d, 12, 0)
  const t = new AdhanPrayerTimes(coords, probe, params(methodId))
  return { fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha }
}

export function fajrInstantForCityDate(loc: LocationInfo, methodId: string, y: number, m: number, d: number): Date {
  return prayerTimesForCityDate(loc, methodId, y, m, d).fajr
}

/** Fajr instant of the location-calendar-date containing `instant`. */
export function fajrOfCityDateContaining(loc: LocationInfo, methodId: string, instant: Date | number): Date {
  const p = cityDateOf(loc.timezone, instant)
  return fajrInstantForCityDate(loc, methodId, p.y, p.m, p.d)
}

export interface NextPrayerInfo {
  key: PrayerKey
  time: Date
  tomorrow: boolean
}

/** The next of the five prayers after `now`, rolling over to tomorrow's Fajr. */
export function nextPrayerAfter(loc: LocationInfo, methodId: string, now: Date): NextPrayerInfo {
  const p = cityDateOf(loc.timezone, now)
  const today = prayerTimesForCityDate(loc, methodId, p.y, p.m, p.d)
  for (const key of PRAYER_ORDER) {
    const t = today[key]
    if (t.getTime() > now.getTime()) return { key, time: t, tomorrow: false }
  }
  const tm = shiftCityDate(p, 1)
  const tomorrow = prayerTimesForCityDate(loc, methodId, tm.y, tm.m, tm.d)
  return { key: 'fajr', time: tomorrow.fajr, tomorrow: true }
}

/** Today's five times (wall-clock formatted elsewhere). */
export function todaysFiveTimes(loc: LocationInfo, methodId: string, now: Date): { key: PrayerKey; time: Date }[] {
  const p = cityDateOf(loc.timezone, now)
  const t = prayerTimesForCityDate(loc, methodId, p.y, p.m, p.d)
  return PRAYER_ORDER.map((key) => ({ key, time: t[key] }))
}

export const PRAYER_NAMES: Record<PrayerKey, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
}
