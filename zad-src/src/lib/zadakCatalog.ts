/* ZAD — fixed زادك library. Exactly as specified; no invented items. */

import type { ZadakCategory, ZadakItemId } from '../types'

export interface ZadakCatalogEntry {
  id: ZadakItemId
  title: string
  category: ZadakCategory
  /** For weekly fasting items: the calendar weekday they belong to (JS getDay: 1 = Monday, 4 = Thursday). */
  weeklyDay?: number
}

export const ZADAK_CATEGORIES: { id: ZadakCategory; title: string }[] = [
  { id: 'salah', title: 'الصلاة' },
  { id: 'quran', title: 'القرآن' },
  { id: 'khair', title: 'الخير' },
  { id: 'siyam', title: 'الصيام' },
]

export const ZADAK_CATALOG: ZadakCatalogEntry[] = [
  // الصلاة
  { id: 'witr', title: 'الوتر', category: 'salah' },
  { id: 'duha', title: 'الضحى', category: 'salah' },
  { id: 'qiyam', title: 'قيام الليل', category: 'salah' },
  { id: 'rawatib', title: 'السنن الرواتب', category: 'salah' },
  // القرآن
  { id: 'hifz', title: 'حفظ القرآن', category: 'quran' },
  { id: 'hifz-review', title: 'مراجعة الحفظ', category: 'quran' },
  // الخير
  { id: 'sadaqah', title: 'الصدقة', category: 'khair' },
  { id: 'birr-parents', title: 'بر الوالدين', category: 'khair' },
  { id: 'silah-rahim', title: 'صلة الرحم', category: 'khair' },
  { id: 'good-deed', title: 'عمل صالح', category: 'khair' },
  // الصيام — weekly, not daily
  { id: 'fast-monday', title: 'صيام الاثنين', category: 'siyam', weeklyDay: 1 },
  { id: 'fast-thursday', title: 'صيام الخميس', category: 'siyam', weeklyDay: 4 },
]

export function zadakEntry(id: ZadakItemId): ZadakCatalogEntry {
  const entry = ZADAK_CATALOG.find((e) => e.id === id)
  if (!entry) throw new Error(`unknown zadak item: ${id}`)
  return entry
}
