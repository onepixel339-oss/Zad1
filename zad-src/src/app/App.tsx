/*
  ZAD — app shell.
  Local-first: everything the app shows comes from this device.
  Navigation stays small: اليوم / زادك / الإعدادات.
  Adhkar open as internal pages (with hardware-back support).
*/

import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, CirclePlus, Settings2 } from 'lucide-react'
import { ZadProvider } from '../hooks'
import type { ZadData } from '../types'
import * as repo from '../db/repositories'
import { Onboarding } from '../features/onboarding/Onboarding'
import { Home } from '../features/day/Home'
import { ZadakTab } from '../features/zadak/ZadakTab'
import { SettingsTab } from '../features/settings/SettingsTab'
import { AdhkarPage } from '../features/adhkar/AdhkarPage'

import s from './shell.module.css'

type Tab = 'today' | 'zadak' | 'settings'
type Overlay = { kind: 'adhkar'; which: 'morning' | 'evening' } | null

type Phase =
  | { kind: 'loading' }
  | { kind: 'onboard' }
  | { kind: 'ready'; data: ZadData }
  | { kind: 'error' }

async function loadAll(): Promise<ZadData | null> {
  const user = await repo.getUser()
  if (!user) return null
  const journey = (await repo.getJourney()) ?? { id: 'main', startedAt: user.createdAt }
  const zadakItems = await repo.getZadakItems()
  return { user, journey, zadakItems }
}

export function App() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let alive = true
    loadAll()
      .then((data) => {
        if (!alive) return
        setPhase(data ? { kind: 'ready', data } : { kind: 'onboard' })
      })
      .catch(() => {
        if (alive) setPhase({ kind: 'error' })
      })
    return () => {
      alive = false
    }
  }, [reloadKey])

  const handleCreated = useCallback(() => {
    setPhase({ kind: 'loading' })
    setReloadKey((k) => k + 1)
  }, [])

  if (phase.kind === 'loading') {
    return <div className={s.loading} role="status" aria-label="جارٍ التحميل" />
  }

  if (phase.kind === 'error') {
    return (
      <div className={s.errorWrap}>
        <div className={s.errorBox}>
          <p className={s.errorTitle}>تعذّر فتح زاد</p>
          <p className={s.errorText}>
            حدث خلل غير متوقع أثناء قراءة البيانات المحلية. بياناتك لم تُحذف. أعد فتح التطبيق بعد قليل، وسيكون كل شيء كما تركته بإذن الله.
          </p>
        </div>
      </div>
    )
  }

  if (phase.kind === 'onboard') {
    return <Onboarding onCreated={handleCreated} />
  }

  return (
    <ZadProvider initial={phase.data}>
      <ZadShell />
    </ZadProvider>
  )
}

function ZadShell() {
  const [tab, setTab] = useState<Tab>('today')
  const [overlay, setOverlay] = useState<Overlay>(null)

  // hardware/browser back closes the internal adhkar page
  const openAdhkar = useCallback((which: 'morning' | 'evening') => {
    setOverlay({ kind: 'adhkar', which })
    try {
      window.history.pushState({ zadOverlay: true }, '')
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const onPop = () => setOverlay(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // app shortcuts / manifest shortcuts deep link: ?adhkar=morning|evening
  useEffect(() => {
    try {
      const which = new URLSearchParams(window.location.search).get('adhkar')
      if (which === 'morning' || which === 'evening') openAdhkar(which)
    } catch {
      /* ignore */
    }
  }, [openAdhkar])

  const closeAdhkar = useCallback(() => {
    // pop the pushed history state (popstate listener clears the overlay)
    if (window.history.state?.zadOverlay) {
      window.history.back()
    } else {
      setOverlay(null)
    }
  }, [])

  const goZadak = useCallback(() => {
    setOverlay(null)
    setTab('zadak')
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <div className={s.shell}>
      {tab === 'today' && <Home onOpenAdhkar={openAdhkar} onGoZadak={goZadak} />}
      {tab === 'zadak' && <ZadakTab />}
      {tab === 'settings' && <SettingsTab />}

      {overlay?.kind === 'adhkar' ? (
        <div className={s.overlay} role="dialog" aria-modal="true">
          <AdhkarPage which={overlay.which} onBack={closeAdhkar} />
        </div>
      ) : null}

      <nav className={s.tabbar} aria-label="التنقل الرئيسي">
        <div className={s.tabbarInner}>
          <TabButton
            label="اليوم"
            icon={<CalendarDays className={s.tabIcon} />}
            on={tab === 'today'}
            onClick={() => setTab('today')}
          />
          <TabButton
            label="زادك"
            icon={<CirclePlus className={s.tabIcon} />}
            on={tab === 'zadak'}
            onClick={() => setTab('zadak')}
          />
          <TabButton
            label="الإعدادات"
            icon={<Settings2 className={s.tabIcon} />}
            on={tab === 'settings'}
            onClick={() => setTab('settings')}
          />
        </div>
      </nav>
    </div>
  )
}

function TabButton({
  label,
  icon,
  on,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`${s.tab} ${on ? s.tabOn : ''}`}
      onClick={onClick}
      aria-current={on ? 'page' : undefined}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
