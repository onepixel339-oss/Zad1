/*
  ZAD — location service.
  Location is a utility supporting prayer times, never a social feature.
  Nothing leaves the device.
*/

import { CITIES, nearestCity } from '../lib/cities'
import type { LocationInfo } from '../types'

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo'
  } catch {
    return 'Africa/Cairo'
  }
}

export function requestGpsLocation(): Promise<LocationInfo> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const city = nearestCity(latitude, longitude)
        resolve({
          lat: latitude,
          lng: longitude,
          city: city.name,
          timezone: deviceTimezone(),
          source: 'gps',
        })
      },
      (err) => reject(err),
      { timeout: 10000, maximumAge: 3600000 },
    )
  })
}

export function manualLocation(cityName: string): LocationInfo | null {
  const city = CITIES.find((c) => c.name === cityName)
  if (!city) return null
  return { lat: city.lat, lng: city.lng, city: city.name, timezone: city.tz, source: 'manual' }
}
