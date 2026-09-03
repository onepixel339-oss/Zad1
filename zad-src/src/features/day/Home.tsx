/*
  ZAD — Home (اليوم).
  Hierarchy per the product spec:
    time → dates → location → next prayer → أساسك → زادك → add worship
  No percentages, no streaks, no guilt. The day simply begins.
*/

import { useMemo, useState } from 'react'
import { ChevronLeft, MapPin, Navigation, Plus } from 'lucide-react'
import { Divider, SectionTitle, WorshipRow, Screen } from '../../components/shared'
import sh from '../../components/shared.module.css'
import { useNow, useZad } from '../../hooks'
import { PRAYER_NAMES, nextPrayerAfter, todaysFiveTimes } from '../../services/prayerTimes'
import { cityWeekdayOf, formatHijri, formatTime, formatWeekday } from '../../services/time'
import { CITIES } from '../../lib/cities'
import { requestGpsLocation } from '../../services/location'
import { zadakEntry } from '../../lib/zadakCatalog'
import { pagesLabel } from '../../lib/arabic'
import type { PrayerKey, PrayerMode } from '../../types'

import s from './home.module.css'

const PRAYER_KEYS: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

export function Home({
  onOpenAdhkar,
  onGoZadak,
}: {
  onOpenAdhkar: (which: 'morning' | 'evening') => void
  onGoZadak: () => void
}) {
  const { data, actions, completions, appDay } = useZad()
  const { user } = data
  const now = useNow(15000)
  const loc = user.location
  const [timesOpen, setTimesOpen] = useState(false)
  const [locSheet, setLocSheet] = useState(false)

  const tz = loc?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Africa/Cairo'
  const methodId = user.calcMethod

  const next = useMemo(() => {
    if (!loc) return null
    return nextPrayerAfter(loc, methodId, now)
  }, [loc, methodId, now])

  const fiveTimes = useMemo(() => {
    if (!loc) return []
    return todaysFiveTimes(loc, methodId, now)
  }, [loc, methodId, now])

  const quranDone = completions['quran']?.value === 'done'
  const morningDone = completions['adhkar-morning']?.value === 'done'
  const eveningDone = completions['adhkar-evening']?.value === 'done'

  // زادك items — weekly fasting appears only on its own weekday
  const todayZadak = useMemo(() => {
    const weekday = cityWeekdayOf(tz, now)
    return data.zadakItems.filter((it) => {
      const entry = zadakEntry(it.id)
      if (entry.weeklyDay === undefined) return true
      return entry.weeklyDay === weekday
    })
  }, [data.zadakItems, now, tz])

  const setPrayerMode = (key: PrayerKey, mode: PrayerMode) => {
    const current = completions[key]
    // tapping the selected mode again quietly clears it (correction allowed)
    if (current?.value === mode) actions.setPrayer(key, null)
    else actions.setPrayer(key, mode)
  }

  return (
    <Screen>
      <header className={s.header}>
        <div className={s.brand}>زاد</div>
        <h1 className={s.dayNumber}>اليوم {appDay ? appDay.day : '…'}</h1>
        <p className={s.dateLine}>
          {formatWeekday(now, tz)} • {formatHijri(now, tz)}
        </p>
        <div className={s.timeLoc}>
          <span className={s.time}>{formatTime(now, tz)}</span>
          <button type="button" className={s.locBtn} onClick={() => setLocSheet(true)}>
            <MapPin className={s.pinIcon} aria-hidden="true" />
            <span>{loc ? loc.city : 'حدد موقعك'}</span>
          </button>
        </div>
      </header>

      {next && loc ? (
        <button
          type="button"
          className={s.nextPrayer}
          onClick={() => setTimesOpen((v) => !v)}
          aria-expanded={timesOpen}
        >
          <span className={s.nextLabel}>الصلاة القادمة</span>
          <span className={s.nextLine}>
            <span className={s.nextName}>
              {PRAYER_NAMES[next.key]}
              {next.tomorrow ? <span className={s.nextTomorrow}> (غدًا)</span> : null}
            </span>
            <span className={s.nextEnd}>
              <span className={s.nextTime}>{formatTime(next.time, loc.timezone)}</span>
              <ChevronLeft className={`${s.chev} ${timesOpen ? s.chevOpen : ''}`} aria-hidden="true" />
            </span>
          </span>
          {timesOpen ? (
            <span className={s.timesList}>
              {fiveTimes.map((t) => (
                <span key={t.key} className={`${s.timesRow} ${t.key === next.key && !next.tomorrow ? s.timesRowCurrent : ''}`}>
                  <span className={s.timesName}>{PRAYER_NAMES[t.key]}</span>
                  <span>{formatTime(t.time, loc.timezone)}</span>
                </span>
              ))}
            </span>
          ) : null}
        </button>
      ) : (
        <button type="button" className={s.nextPrayer} onClick={() => setLocSheet(true)}>
          <span className={s.nextLabel}>لعرض مواقيت الصلاة</span>
          <span className={s.nextLine}>
            <span className={s.nextName}>حدد موقعك</span>
            <ChevronLeft className={s.chev} aria-hidden="true" />
          </span>
        </button>
      )}

      <Divider />
      <SectionTitle>أساسك</SectionTitle>

      <div className={s.subSection}>
        <p className={s.subLabel}>الصلاة</p>
        {PRAYER_KEYS.map((key) => {
          const rec = completions[key]
          const mode: PrayerMode | null = rec && rec.value !== 'done' ? (rec.value as PrayerMode) : null
          return (
            <WorshipRow
              key={key}
              title={PRAYER_NAMES[key]}
              action={
                <span className={sh.segmented} role="group" aria-label={`${PRAYER_NAMES[key]} — فرد أو جماعة`}>
                  <button
                    type="button"
                    className={`${sh.seg} ${mode === 'fard' ? sh.segOn : ''}`}
                    aria-pressed={mode === 'fard'}
                    onClick={() => setPrayerMode(key, 'fard')}
                  >
                    فرد
                  </button>
                  <button
                    type="button"
                    className={`${sh.seg} ${mode === 'jamaah' ? sh.segOn : ''}`}
                    aria-pressed={mode === 'jamaah'}
                    onClick={() => setPrayerMode(key, 'jamaah')}
                  >
                    جماعة
                  </button>
                </span>
              }
            />
          )
        })}
      </div>

      <div className={s.subSection}>
        <p className={s.subLabel}>ورد القرآن</p>
        <WorshipRow
          title="ورد القرآن"
          meta={pagesLabel(user.quranPages)}
          done={quranDone}
          onToggle={(nextDone) => actions.toggleSimple('quran', 'quran', nextDone)}
        />
      </div>

      <div className={s.subSection}>
        <p className={s.subLabel}>الأذكار</p>
        <WorshipRow
          title="أذكار الصباح"
          done={morningDone}
          onClick={() => onOpenAdhkar('morning')}
          ariaLabel="أذكار الصباح — فتح الصفحة"
        />
        <WorshipRow
          title="أذكار المساء"
          done={eveningDone}
          onClick={() => onOpenAdhkar('evening')}
          ariaLabel="أذكار المساء — فتح الصفحة"
        />
      </div>

      <Divider />
      <SectionTitle>زادك</SectionTitle>

      {todayZadak.length === 0 ? (
        <p className={s.emptyZadak}>
          لم تختر عبادة بعد.{' '}
          <button type="button" className={s.addBtn} style={{ minHeight: 32 }} onClick={onGoZadak}>
            اختر من المكتبة
          </button>
        </p>
      ) : (
        todayZadak.map((it) => {
          const entry = zadakEntry(it.id)
          return (
            <WorshipRow
              key={it.id}
              title={entry.title}
              done={completions[it.id]?.value === 'done'}
              onToggle={(nextDone) => actions.toggleSimple('zadak', it.id, nextDone)}
            />
          )
        })
      )}

      <div className={s.addWrap}>
        <button type="button" className={s.addBtn} onClick={onGoZadak}>
          <Plus className={s.addIcon} aria-hidden="true" />
          إضافة عبادة
        </button>
      </div>

      {locSheet ? (
        <LocationSheet
          onClose={() => setLocSheet(false)}
          onPick={(cityName) => {
            actions.updateLocation(manualByName(cityName))
            setLocSheet(false)
          }}
          onGps={async () => {
            try {
              const gps = await requestGpsLocation()
              actions.updateLocation(gps)
              setLocSheet(false)
            } catch {
              // permission denied or unavailable — manual selection remains
            }
          }}
          hasGps={loc?.source === 'gps'}
        />
      ) : null}
    </Screen>
  )
}

function manualByName(name: string) {
  const c = CITIES.find((x) => x.name === name)
  if (!c) throw new Error('city not found')
  return { lat: c.lat, lng: c.lng, city: c.name, timezone: c.tz, source: 'manual' as const }
}

function LocationSheet({
  onClose,
  onPick,
  onGps,
  hasGps,
}: {
  onClose: () => void
  onPick: (city: string) => void
  onGps: () => void
  hasGps: boolean
}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return CITIES
    return CITIES.filter((c) => c.name.includes(q))
  }, [query])

  return (
    <div className={s.sheetBackdrop} onClick={onClose} role="presentation">
      <div className={s.sheet} role="dialog" aria-modal="true" aria-label="اختيار الموقع" onClick={(e) => e.stopPropagation()}>
        <h3 className={s.sheetTitle}>الموقع</h3>
        <button type="button" className={s.gpsBtn} onClick={onGps}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Navigation size={15} aria-hidden="true" />
            تحديد الموقع تلقائيًا
          </span>
        </button>
        <p className={s.gpsNote}>
          {hasGps ? 'الموقع الحالي محدد تلقائيًا.' : 'إن رفضت الإذن، اختر مدينتك يدويًا من القائمة.'}
        </p>
        <input
          className={s.citySearch}
          type="text"
          placeholder="ابحث عن مدينتك"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="ابحث عن مدينة"
        />
        <div className={s.cityList}>
          {filtered.length === 0 ? (
            <p className={s.noCity}>لا توجد نتائج مطابقة</p>
          ) : (
            filtered.map((c) => (
              <button key={c.name} type="button" className={s.cityItem} onClick={() => onPick(c.name)}>
                {c.name}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
