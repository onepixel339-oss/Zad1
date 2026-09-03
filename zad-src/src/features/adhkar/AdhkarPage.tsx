/*
  ZAD — أذكار الصباح / أذكار المساء (internal pages).
  Texts are authentic, sourced from حصن المسلم — never invented.
  Reading comfort is the priority; the completion action stays quiet.
*/

import { Check } from 'lucide-react'
import { PageHeader, Screen } from '../../components/shared'
import { useZad } from '../../hooks'
import { EVENING_ADHKAR, MORNING_ADHKAR } from './content'

import s from './adhkar.module.css'

export function AdhkarPage({ which, onBack }: { which: 'morning' | 'evening'; onBack: () => void }) {
  const set = which === 'morning' ? MORNING_ADHKAR : EVENING_ADHKAR
  const itemId = which === 'morning' ? 'adhkar-morning' : 'adhkar-evening'
  const { actions, completions } = useZad()
  const done = completions[itemId]?.value === 'done'

  return (
    <Screen>
      <div className={s.header}>
        <PageHeader title={set.title} onBack={onBack} />
        <p className={s.intro}>
          النصوص من كتاب «حصن المسلم» للشيخ سعيد بن علي بن وهف القحطاني، ثابتة في الصحيحين وسائر الكتب المعتمدة.
        </p>
      </div>

      <div>
        {set.items.map((item, i) => (
          <article key={i} className={s.item}>
            <p className={s.itemIndex}>{i + 1}</p>
            <p className={s.dhikrText}>{item.text}</p>
            {item.count ? <span className={s.count}>{item.count}</span> : null}
            {item.virtue ? <p className={s.virtue}>{item.virtue}</p> : null}
            <p className={s.dhikrSource}>{item.source}</p>
          </article>
        ))}
      </div>

      <div className={s.doneArea}>
        <button
          type="button"
          className={`${s.doneBtn} ${done ? s.doneBtnDone : ''}`}
          onClick={() => actions.toggleSimple('adhkar', itemId, !done)}
          aria-pressed={done}
        >
          <Check className={s.doneIcon} aria-hidden="true" />
          {done ? 'أنجزتها' : 'أنجزت الأذكار'}
        </button>
      </div>
    </Screen>
  )
}
