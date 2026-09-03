/*
  ZAD — theme preference.
  A very small preference, persisted in localStorage as the spec suggests.
  فاتح | داكن | النظام
*/

import type { ThemePreference } from '../types'

const KEY = 'zad.theme'

export function loadThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* private mode etc. — fall through */
  }
  return 'system'
}

export function saveThemePreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(KEY, pref)
  } catch {
    /* ignore */
  }
}

const mq = typeof window !== 'undefined' && 'matchMedia' in window
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null

export function applyTheme(pref: ThemePreference): void {
  const effective = pref === 'system' ? (mq?.matches ? 'dark' : 'light') : pref
  document.documentElement.dataset.theme = effective
}

/** Subscribe to system scheme changes (used while on النظام). */
export function onSystemSchemeChange(cb: () => void): () => void {
  if (!mq) return () => undefined
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
