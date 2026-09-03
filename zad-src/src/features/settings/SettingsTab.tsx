/*
  ZAD — الإعدادات.
  Name, Quran pages, worship management, location, appearance, sources.
  Everything simple; nothing that adds pressure.
*/

import { useState } from 'react'
import { Divider, Screen, SectionTitle } from '../../components/shared'
import { useTheme, useZad } from '../../hooks'
import { CITIES } from '../../lib/cities'
import { CALC_METHODS, DEFAULT_METHOD, calcMethodLabel } from '../../services/prayerTimes'
import { requestGpsLocation } from '../../services/location'
import { pagesLabel } from '../../lib/arabic'
import type { ThemePreference } from '../../types'

import s from './settings.module.css'

export function SettingsTab() {
  const { data, actions } = useZad()
  const { user } = data
  const [themePref, setThemePref] = useTheme()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(user.name)
  const [gpsNote, setGpsNote] = useState<string | null>(null)

  const commitName = () => {
    const trimmed = nameDraft.trim()
    if (trimmed) void actions.updateName(trimmed)
    else setNameDraft(user.name)
    setEditingName(false)
  }

  const tryGps = async () => {
    setGpsNote('جارٍ تحديد الموقع…')
    try {
      const loc = await requestGpsLocation()
      await actions.updateLocation(loc)
      setGpsNote(null)
    } catch {
      setGpsNote('تعذّر تحديد الموقع. اختر مدينتك يدويًا.')
    }
  }

  return (
    <Screen>
      <header className={s.head}>
        <h1 className={s.title}>الإعدادات</h1>
      </header>

      <div className={s.group}>
        <p className={s.groupTitle}>الاسم</p>
        {editingName ? (
          <div className={s.nameRow}>
            <input
              className={s.nameInput}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName()
              }}
              autoFocus
              maxLength={40}
              aria-label="الاسم"
            />
            <button type="button" className={s.nameEdit} onClick={commitName}>
              حفظ
            </button>
          </div>
        ) : (
          <div className={s.nameRow}>
            <span className={s.nameText}>{user.name}</span>
            <button
              type="button"
              className={s.nameEdit}
              onClick={() => {
                setNameDraft(user.name)
                setEditingName(true)
              }}
            >
              تعديل
            </button>
          </div>
        )}
      </div>

      <div className={s.group}>
        <p className={s.groupTitle}>عدد صفحات القرآن اليومية</p>
        <div className={s.stepper}>
          <button
            type="button"
            className={s.stepBtn}
            onClick={() => void actions.updateQuranPages(Math.max(1, user.quranPages - 1))}
            aria-label="إنقاص صفحة"
          >
            −
          </button>
          <span className={s.stepValue} aria-live="polite">
            {pagesLabel(user.quranPages)}
          </span>
          <button
            type="button"
            className={s.stepBtn}
            onClick={() => void actions.updateQuranPages(Math.min(60, user.quranPages + 1))}
            aria-label="زيادة صفحة"
          >
            +
          </button>
        </div>
      </div>

      <div className={s.group}>
        <p className={s.groupTitle}>الموقع الحالي</p>
        <div className={s.valueLine}>{user.location ? user.location.city : 'لم يُحدد بعد'}</div>
        <button type="button" className={s.valueBtn} onClick={() => void tryGps()}>
          <span className={s.valueLine} style={{ fontWeight: 400 }}>
            تحديد الموقع تلقائيًا
          </span>
          <span className={s.changeHint}>تفعيل</span>
        </button>
        <p className={s.groupTitle} style={{ marginTop: 8 }}>
          اختيار الموقع يدويًا
        </p>
        <select
          className={s.citySelect}
          value={user.location?.source === 'manual' ? user.location.city : ''}
          onChange={(e) => {
            const city = CITIES.find((c) => c.name === e.target.value)
            if (city) {
              void actions.updateLocation({
                lat: city.lat,
                lng: city.lng,
                city: city.name,
                timezone: city.tz,
                source: 'manual',
              })
              setGpsNote(null)
            }
          }}
          aria-label="اختيار المدينة يدويًا"
        >
          <option value="" disabled>
            اختر مدينتك
          </option>
          {CITIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        {gpsNote ? <p className={s.groupTitle}>{gpsNote}</p> : null}
      </div>

      <div className={s.group}>
        <p className={s.groupTitle}>طريقة حساب المواقيت</p>
        <select
          className={s.citySelect}
          style={{ marginTop: 0 }}
          value={user.calcMethod || DEFAULT_METHOD}
          onChange={(e) => void actions.updateCalcMethod(e.target.value)}
          aria-label="طريقة حساب المواقيت"
        >
          {CALC_METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className={s.group}>
        <p className={s.groupTitle}>المظهر</p>
        <div className={s.themeSeg} role="group" aria-label="المظهر">
          {(
            [
              ['light', 'فاتح'],
              ['dark', 'داكن'],
              ['system', 'النظام'],
            ] as [ThemePreference, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`${s.themeOpt} ${themePref === value ? s.themeOptOn : ''}`}
              aria-pressed={themePref === value}
              onClick={() => setThemePref(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      <SectionTitle>عن زاد</SectionTitle>
      <p className={s.aboutText} style={{ marginTop: 6 }}>
        زاد رفيق هادئ يوثّق ما أنجزته من عبادة، لا ما تقصّرت فيه. اليوم عندنا يبدأ من الفجر، وأرقام الأيام تتقدّم بهدوء، يومًا بعد يوم.
        بياناتك كلها محفوظة على جهازك وحده: لا حساب، لا مزامنة، لا إعلانات، ولا شيء يُرسل إلى أي خادم.
      </p>

      <div className={s.group} style={{ borderBottom: 'none' }}>
        <p className={s.groupTitle}>المصادر</p>
        <div className={s.sourceLine}>
          <span className={s.sourceKey}>الأذكار</span>
          <span className={s.sourceVal}>حصن المسلم — الشيخ سعيد بن علي بن وهف القحطاني</span>
        </div>
        <div className={s.sourceLine}>
          <span className={s.sourceKey}>مواقيت الصلاة</span>
          <span className={s.sourceVal}>
            محرك adhan الفلكي — {calcMethodLabel(user.calcMethod || DEFAULT_METHOD)}
          </span>
        </div>
        <div className={s.sourceLine}>
          <span className={s.sourceKey}>التقويم الهجري</span>
          <span className={s.sourceVal}>أم القرى (حساب تقريبي)</span>
        </div>
      </div>
    </Screen>
  )
}
