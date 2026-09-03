/* ZAD — shared, deliberately few, components */

import { Check, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import s from './shared.module.css'

export function Screen({ children }: { children: ReactNode }) {
  return <div className={s.screen}>{children}</div>
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className={s.sectionTitle}>{children}</h2>
}

export function Divider() {
  return <hr className={s.divider} />
}

/** A worship row. Whole row is tappable when onClick is given. */
export function WorshipRow({
  title,
  meta,
  done,
  onToggle,
  onClick,
  action,
  ariaLabel,
}: {
  title: string
  meta?: string
  done?: boolean
  onToggle?: (next: boolean) => void
  onClick?: () => void
  /** fully custom end-of-row control (e.g. فرد | جماعة) */
  action?: ReactNode
  ariaLabel?: string
}) {
  const inner = (
    <>
      <span className={s.rowMain}>
        <span className={s.rowTitle}>{title}</span>
        {meta ? <span className={s.rowMeta}>{meta}</span> : null}
      </span>
      {action ?? (
        <span className={`${s.check} ${done ? s.checkDone : ''}`} aria-hidden="true">
          <Check className={s.checkIcon} />
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button type="button" className={s.rowButton} onClick={onClick} aria-label={ariaLabel}>
        <span className={s.row}>{inner}</span>
      </button>
    )
  }

  if (action) {
    // has its own interactive control inside — must not be a nested button
    return (
      <div className={s.row} role="group" aria-label={ariaLabel ?? title}>
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={s.rowButton}
      onClick={() => onToggle?.(!done)}
      aria-pressed={done}
      aria-label={ariaLabel ?? `${title}${done ? ' — أنجزتها' : ''}`}
    >
      <span className={s.row}>{inner}</span>
    </button>
  )
}

/** The completion checkmark — quiet, never celebratory. */
export function CheckMark({ done }: { done: boolean }) {
  return (
    <span className={`${s.check} ${done ? s.checkDone : ''}`} aria-hidden="true">
      <Check className={s.checkIcon} />
    </span>
  )
}

/** Internal page header with back — adhkar pages, sub-screens. */
export function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className={s.pageHeader}>
      <button type="button" className={s.backBtn} onClick={onBack} aria-label="رجوع">
        <ChevronRight className={s.backIcon} />
        <span className={s.pageTitle}>{title}</span>
      </button>
    </div>
  )
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className={s.notice}>{children}</p>
}
