/*
  ZAD — local database (IndexedDB).
  The only module that touches IndexedDB directly. UI never imports this.
*/

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CompletionRecord, JourneyRecord, UserRecord, ZadakItemRecord } from '../types'

interface ZadDB extends DBSchema {
  users: {
    key: string
    value: UserRecord
  }
  journey: {
    key: string
    value: JourneyRecord
  }
  completions: {
    key: string
    value: CompletionRecord
    indexes: { byDay: number }
  }
  zadakItems: {
    key: string
    value: ZadakItemRecord
  }
}

let dbPromise: Promise<IDBPDatabase<ZadDB>> | null = null

/** Opens (and creates) the database. Safe to call repeatedly. */
export function getDb(): Promise<IDBPDatabase<ZadDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ZadDB>('zad-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('journey')) {
          db.createObjectStore('journey', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('completions')) {
          const store = db.createObjectStore('completions', { keyPath: 'id' })
          store.createIndex('byDay', 'appDay')
        }
        if (!db.objectStoreNames.contains('zadakItems')) {
          db.createObjectStore('zadakItems', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}
