/*
  ZAD — repository layer.
  The single interface between the app and its local data.
  Completion ids are natural keys (appDay:itemType:itemId) so duplicates
  are structurally impossible and re-saving is idempotent.
*/

import { getDb } from './client'
import type {
  CompletionItemType,
  CompletionRecord,
  JourneyRecord,
  PrayerMode,
  UserRecord,
  ZadakItemId,
  ZadakItemRecord,
} from '../types'

/* ------------------------------- user ------------------------------- */

export async function getUser(): Promise<UserRecord | undefined> {
  const db = await getDb()
  return db.get('users', 'local')
}

export async function saveUser(user: UserRecord): Promise<void> {
  const db = await getDb()
  await db.put('users', user)
}

/* ------------------------------ journey ------------------------------ */

export async function getJourney(): Promise<JourneyRecord | undefined> {
  const db = await getDb()
  return db.get('journey', 'main')
}

export async function saveJourney(journey: JourneyRecord): Promise<void> {
  const db = await getDb()
  await db.put('journey', journey)
}

/* ----------------------------- completions ----------------------------- */

function completionId(appDay: number, itemType: CompletionItemType, itemId: string): string {
  return `${appDay}:${itemType}:${itemId}`
}

export async function getCompletionsForDay(appDay: number): Promise<CompletionRecord[]> {
  const db = await getDb()
  return db.getAllFromIndex('completions', 'byDay', appDay)
}

export async function setCompletion(
  appDay: number,
  itemType: CompletionItemType,
  itemId: string,
  value: PrayerMode | 'done' | null,
): Promise<void> {
  const db = await getDb()
  const id = completionId(appDay, itemType, itemId)
  if (value === null) {
    await db.delete('completions', id)
    return
  }
  const record: CompletionRecord = {
    id,
    appDay,
    itemType,
    itemId,
    value,
    completedAt: Date.now(),
  }
  await db.put('completions', record)
}

/* ------------------------------ zadak ------------------------------ */

export async function getZadakItems(): Promise<ZadakItemRecord[]> {
  const db = await getDb()
  const all = await db.getAll('zadakItems')
  return all.sort((a, b) => a.addedAt - b.addedAt)
}

export async function addZadakItem(id: ZadakItemId): Promise<void> {
  const db = await getDb()
  const existing = await db.get('zadakItems', id)
  if (existing) return // duplicate prevention
  await db.put('zadakItems', { id, addedAt: Date.now() })
}

export async function removeZadakItem(id: ZadakItemId): Promise<void> {
  const db = await getDb()
  await db.delete('zadakItems', id)
  // historical completion records are intentionally preserved
}
