/* ZAD — shared hooks */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  CompletionItemType,
  CompletionRecord,
  LocationInfo,
  PrayerMode,
  ThemePreference,
  UserRecord,
  ZadData,
  ZadakItemId,
  ZadakItemRecord,
} from '../types'
import * as repo from '../db/repositories'
import { applyTheme, loadThemePreference, onSystemSchemeChange, saveThemePreference } from '../lib/theme'
import { computeAppDay, type AppDayInfo } from '../services/appDay'

/* ------------------------------- clock ------------------------------- */

/** Re-renders at a steady interval; used for the quiet clock display. */
export function useNow(intervalMs = 20000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(new Date())
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])
  return now
}

/* ------------------------------- theme ------------------------------- */

export function useTheme(): [ThemePreference, (p: ThemePreference) => void] {
  const [pref, setPref] = useState<ThemePreference>(() => loadThemePreference())

  useEffect(() => {
    applyTheme(pref)
    saveThemePreference(pref)
    if (pref !== 'system') return
    // re-apply when the system scheme changes while on النظام
    return onSystemSchemeChange(() => applyTheme('system'))
  }, [pref])

  const update = useCallback((p: ThemePreference) => setPref(p), [])
  return [pref, update]
}

/* ----------------------------- app data ----------------------------- */

export interface CompletionMap {
  [itemId: string]: CompletionRecord
}

interface ZadActions {
  updateName: (name: string) => Promise<void>
  updateQuranPages: (pages: number) => Promise<void>
  updateLocation: (loc: LocationInfo) => Promise<void>
  updateCalcMethod: (methodId: string) => Promise<void>
  addZadak: (id: ZadakItemId) => Promise<void>
  removeZadak: (id: ZadakItemId) => Promise<void>
  /** mark/unmark a simple completion (quran, adhkar, zadak) */
  toggleSimple: (itemType: CompletionItemType, itemId: string, done: boolean) => void
  /** set/clear فرد | جماعة for a prayer */
  setPrayer: (prayerKey: string, mode: PrayerMode | null) => void
}

export interface ZadContextValue {
  data: ZadData
  appDay: AppDayInfo | null
  completions: CompletionMap
  actions: ZadActions
}

const ZadContext = createContext<ZadContextValue | null>(null)

/**
 * Holds the live application data and the current App Day.
 * Actions write to the repository first — the device database remains
 * the single source of truth — then reflect the change in memory so
 * every screen (home, tabs, internal pages) sees the same state.
 */
export function ZadProvider({ initial, children }: { initial: ZadData; children: ReactNode }) {
  const [data, setData] = useState<ZadData>(initial)
  const [completions, setCompletions] = useState<CompletionMap>({})

  /*
   * The journey day must always be visible (اليوم ١ from the very first
   * moment), even before the user picks a location — so the day engine
   * falls back to Cairo + device timezone until a real location exists.
   */
  const fallbackLoc = useMemo<LocationInfo>(
    () => ({
      lat: 30.04,
      lng: 31.24,
      city: 'القاهرة',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
      source: 'manual',
    }),
    [],
  )
  const loc = data.user.location ?? fallbackLoc
  const appDay = useAppDay(data.journey.startedAt, loc, data.user.calcMethod)

  // completion records of the current App Day — re-read on day change
  const appDayNumber = appDay?.day ?? null
  useEffect(() => {
    let alive = true
    if (appDayNumber === null) {
      setCompletions({})
      return
    }
    repo.getCompletionsForDay(appDayNumber).then((records) => {
      if (!alive) return
      const next: CompletionMap = {}
      for (const r of records) next[r.itemId] = r
      setCompletions(next)
    })
    return () => {
      alive = false
    }
  }, [appDayNumber])

  const write = useCallback(
    async (itemType: CompletionItemType, itemId: string, value: PrayerMode | 'done' | null) => {
      if (appDayNumber === null) return
      await repo.setCompletion(appDayNumber, itemType, itemId, value)
      const records = await repo.getCompletionsForDay(appDayNumber)
      const next: CompletionMap = {}
      for (const r of records) next[r.itemId] = r
      setCompletions(next)
    },
    [appDayNumber],
  )

  const actions = useMemo<ZadActions>(() => {
    const patchUser = async (patch: Partial<UserRecord>) => {
      setData((prev) => {
        const next = { ...prev, user: { ...prev.user, ...patch } }
        void repo.saveUser(next.user)
        return next
      })
    }
    return {
      updateName: (name) => patchUser({ name }),
      updateQuranPages: (quranPages) => patchUser({ quranPages }),
      updateLocation: (location) => patchUser({ location }),
      updateCalcMethod: (calcMethod) => patchUser({ calcMethod }),
      addZadak: async (id) => {
        const rec: ZadakItemRecord = { id, addedAt: Date.now() }
        setData((prev) => {
          if (prev.zadakItems.some((it) => it.id === id)) return prev // no duplicates
          void repo.addZadakItem(id)
          return { ...prev, zadakItems: [...prev.zadakItems, rec] }
        })
      },
      removeZadak: async (id) => {
        setData((prev) => ({ ...prev, zadakItems: prev.zadakItems.filter((it) => it.id !== id) }))
        await repo.removeZadakItem(id)
      },
      toggleSimple: (itemType, itemId, done) => {
        void write(itemType, itemId, done ? 'done' : null)
      },
      setPrayer: (prayerKey, mode) => {
        void write('prayer', prayerKey, mode)
      },
    }
  }, [write])

  const value = useMemo(
    () => ({ data, appDay, completions, actions }),
    [data, appDay, completions, actions],
  )
  return <ZadContext.Provider value={value}>{children}</ZadContext.Provider>
}

export function useZad(): ZadContextValue {
  const ctx = useContext(ZadContext)
  if (!ctx) throw new Error('useZad outside provider')
  return ctx
}

/* ------------------------------ app day ------------------------------ */

/**
 * Current App Day, recomputed:
 *  - every 20s (crossing Fajr while the app is open updates without reload)
 *  - when returning to the app after being away
 *  - when location or method changes
 */
export function useAppDay(
  journeyStartedAt: number,
  loc: LocationInfo | null,
  methodId: string,
): AppDayInfo | null {
  const [info, setInfo] = useState<AppDayInfo | null>(null)

  const recompute = useCallback(() => {
    if (!loc) {
      setInfo(null)
      return
    }
    setInfo(computeAppDay(new Date(), journeyStartedAt, loc, methodId))
  }, [journeyStartedAt, loc, methodId])

  useEffect(() => {
    recompute()
    const id = window.setInterval(recompute, 20000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') recompute()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [recompute])

  return info
}
