/* ZAD — domain types */

export type ThemePreference = 'light' | 'dark' | 'system'

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

/** فرد | جماعة — the only two completion choices for a prayer */
export type PrayerMode = 'fard' | 'jamaah'

export type ZadakCategory = 'salah' | 'quran' | 'khair' | 'siyam'

export type ZadakItemId =
  | 'witr'
  | 'duha'
  | 'qiyam'
  | 'rawatib'
  | 'hifz'
  | 'hifz-review'
  | 'sadaqah'
  | 'birr-parents'
  | 'silah-rahim'
  | 'good-deed'
  | 'fast-monday'
  | 'fast-thursday'

export type CompletionItemType = 'prayer' | 'quran' | 'adhkar' | 'zadak'

export interface LocationInfo {
  lat: number
  lng: number
  city: string
  timezone: string
  source: 'gps' | 'manual'
}

/** The single local user (no accounts — privacy first). */
export interface UserRecord {
  id: 'local'
  name: string
  createdAt: number
  timezone: string
  location: LocationInfo | null
  quranPages: number
  calcMethod: string
}

/** The journey start anchors the sequential day numbering. */
export interface JourneyRecord {
  id: 'main'
  startedAt: number
}

/**
 * One record per (appDay, item, kind) — the natural primary key makes
 * duplicate completions impossible.
 */
export interface CompletionRecord {
  id: string
  appDay: number
  itemType: CompletionItemType
  itemId: string
  value: PrayerMode | 'done'
  completedAt: number
}

/** A worship item the user added to زادك. */
export interface ZadakItemRecord {
  id: ZadakItemId
  addedAt: number
}

/** Aggregated view loaded by the app shell. */
export interface ZadData {
  user: UserRecord
  journey: JourneyRecord
  zadakItems: ZadakItemRecord[]
}
