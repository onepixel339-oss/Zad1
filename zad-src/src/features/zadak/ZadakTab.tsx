/*
  ZAD — زادك.
  The fixed worship library (الصلاة / القرآن / الخير / الصيام) — nothing more.
  Adding and removing is direct and calm; duplicates are impossible by
  design (catalogue ids), and history is preserved when removing.
*/

import { Divider, SectionTitle, Screen, WorshipRow } from '../../components/shared'
import { useZad } from '../../hooks'
import { ZADAK_CATALOG, ZADAK_CATEGORIES, zadakEntry } from '../../lib/zadakCatalog'
import type { ZadakCategory, ZadakItemId } from '../../types'

import s from './zadak.module.css'

export function ZadakTab() {
  const { data, actions, completions } = useZad()

  const selected = new Set(data.zadakItems.map((it) => it.id))

  return (
    <Screen>
      <header className={s.head}>
        <h1 className={s.title}>زادك</h1>
      </header>

      <div className={s.sectionGap}>
        <SectionTitle>عباداتي المختارة</SectionTitle>
        {data.zadakItems.length === 0 ? (
          <p className={s.empty}>
            لا شيء بعد. اختر ما يناسبك من المكتبة بالأسفل، وستظهر هنا وفي صفحة اليوم.
          </p>
        ) : (
          data.zadakItems.map((it) => {
            const entry = zadakEntry(it.id)
            return (
              <WorshipRow
                key={it.id}
                title={entry.title}
                meta={entry.weeklyDay !== undefined ? 'يوم أسبوعي محدد' : undefined}
                done={completions[it.id]?.value === 'done'}
                onToggle={(nextDone) => actions.toggleSimple('zadak', it.id, nextDone)}
              />
            )
          })
        )}
      </div>

      <Divider />

      <SectionTitle>المكتبة</SectionTitle>
      {ZADAK_CATEGORIES.map((cat) => (
        <CategoryBlock
          key={cat.id}
          category={cat.id}
          title={cat.title}
          selected={selected}
          onAdd={(id) => void actions.addZadak(id)}
          onRemove={(id) => void actions.removeZadak(id)}
        />
      ))}
    </Screen>
  )
}

function CategoryBlock({
  category,
  title,
  selected,
  onAdd,
  onRemove,
}: {
  category: ZadakCategory
  title: string
  selected: Set<string>
  onAdd: (id: ZadakItemId) => void
  onRemove: (id: ZadakItemId) => void
}) {
  const items = ZADAK_CATALOG.filter((e) => e.category === category)
  return (
    <div>
      <p className={s.catLabel}>{title}</p>
      {items.map((entry) => {
        const isSelected = selected.has(entry.id)
        return (
          <div key={entry.id} className={s.libRow}>
            <span className="libTitle" style={{ fontSize: 16, fontWeight: 500 }}>
              {entry.title}
            </span>
            {isSelected ? (
              <button type="button" className={s.libRemove} onClick={() => onRemove(entry.id)}>
                إزالة
              </button>
            ) : (
              <button type="button" className={s.libAdd} onClick={() => onAdd(entry.id)}>
                إضافة
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
