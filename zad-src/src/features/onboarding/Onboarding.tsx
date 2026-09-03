/* ZAD — first launch. One question only: ما اسمك؟ */

import { useState } from 'react'
import * as repo from '../../db/repositories'

import s from './onboarding.module.css'

export function Onboarding({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const valid = name.trim().length > 0

  const enter = async () => {
    if (!valid || busy) return
    setBusy(true)
    try {
      const now = Date.now()
      await repo.saveUser({
        id: 'local',
        name: name.trim(),
        createdAt: now,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
        location: null,
        quranPages: 5,
        calcMethod: 'egyptian',
      })
      await repo.saveJourney({ id: 'main', startedAt: now })
      // straight into the app — no slides, no questionnaires
      onCreated()
    } catch {
      // calm and human — nothing was destroyed; the user can retry
      setBusy(false)
    }
  }

  return (
    <div className="onboardWrap">
      <header className={s.header}>
        <h1 className={s.wordmark}>زاد</h1>
        <p className={s.sub}>رفيقك الهادئ للعبادة</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void enter()
        }}
      >
        <p className={s.question}>ما اسمك؟</p>
        <input
          className={s.nameInput}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اكتب اسمك"
          aria-label="الاسم"
          autoFocus
          maxLength={40}
        />
        <button className={s.enterBtn} type="submit" disabled={!valid || busy}>
          متابعة
        </button>
      </form>

      <p className={s.privacy}>بياناتك تبقى على جهازك، ولا يُطلب منك حساب.</p>
    </div>
  )
}
