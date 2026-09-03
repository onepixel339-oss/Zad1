/*
  ZAD — App Day engine (the core business rule).

  A ZAD day begins at local Fajr — never midnight, never Maghrib.
    3:00 AM  → previous ZAD day
    4:39 AM  → previous ZAD day
    4:40 AM  → new ZAD day   (when local Fajr is 4:40)

  The journey is sequential: اليوم 1، اليوم 2، اليوم 3 …
  The day number is derived from `journey start + local Fajr boundaries`,
  never from new Date().getDate().

  The user's first ZAD day is the ZAD day containing the journey start.
  If the user does not open ZAD for days, the current journey day is
  simply shown — no missed days, no lost streaks, no failure.
*/

import type { LocationInfo } from '../types'
import { cityDateOf, shiftCityDate } from './time'
import { fajrInstantForCityDate } from './prayerTimes'

export interface AppDayInfo {
  /** اليوم N */
  day: number
  /** Location-calendar-date on which the current ZAD day started. */
  anchorDate: { y: number; m: number; d: number }
  /** Real instant of the next Fajr boundary (ends the current ZAD day). */
  nextFajr: Date
  /** Real instant at which the current ZAD day began. */
  dayStartFajr: Date
}

const MAX_ITERATIONS = 40000 // ~110 years of safe iteration

/**
 * Count Fajr boundaries between the journey start and now.
 * Boundaries are Fajr instants of consecutive location-calendar dates.
 */
export function computeAppDay(
  now: Date,
  journeyStartedAt: number,
  loc: LocationInfo,
  methodId: string,
): AppDayInfo {
  // ZAD-day anchor of the journey start
  const startCity = cityDateOf(loc.timezone, journeyStartedAt)
  const startFajr = fajrInstantForCityDate(loc, methodId, startCity.y, startCity.m, startCity.d)
  let anchor = startFajr.getTime() <= journeyStartedAt
    ? startCity
    : shiftCityDate(startCity, -1)

  let day = 1
  let nextDate = shiftCityDate(anchor, 1)
  let nextFajr = fajrInstantForCityDate(loc, methodId, nextDate.y, nextDate.m, nextDate.d)
  let guard = 0

  while (nextFajr.getTime() <= now.getTime() && guard < MAX_ITERATIONS) {
    day += 1
    anchor = nextDate
    nextDate = shiftCityDate(anchor, 1)
    nextFajr = fajrInstantForCityDate(loc, methodId, nextDate.y, nextDate.m, nextDate.d)
    guard += 1
  }

  const dayStartFajr = fajrInstantForCityDate(loc, methodId, anchor.y, anchor.m, anchor.d)
  return { day, anchorDate: anchor, nextFajr, dayStartFajr }
}
