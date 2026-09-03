/* ZAD — entry point */

// Arabic webfonts, bundled locally for full offline use
import './fonts.css'

import './styles/tokens.css'
import './styles/global.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { initTheme } from './lib/theme'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('root element missing')

// theme applies before the very first screen renders — it never
// depends on the settings tab being mounted (startup was light
// until the user opened الإعدادات — fixed)
initTheme()

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA — offline application shell (skipped in the single-file build:
// a service worker must be a real same-origin file, not inlined HTML)
// BASE_URL keeps this correct under any deploy base ('/' or '/app/').
// Registered immediately at module evaluation: waiting for the load
// event costs detection on fast crawls (PWABuilder), and the old
// wait-for-load advice is obsolete in modern browsers.
if (!__ZAD_SINGLE__ && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
    /* offline shell is a progressive enhancement — stay quiet */
  })
}
