import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { type CmsSnapshot, type Grade, type Testimonial } from '@designing-minds/cms'
import { Eyebrow, Field, SelectField, StatePanel } from '../components/ui'
import { CollectionEditorLayout } from '../components/CollectionEditorLayout'
import { CARD, FIELD, SOLID_BTN } from '../components/tokens'

const NONE = 'Not specified'

export function TestimonialEditorPage({
  snapshot,
  onSave,
  saving,
}: {
  snapshot: CmsSnapshot
  onSave: (testimonial: Testimonial) => Promise<Testimonial | null>
  saving: boolean
}) {
  const { id } = useParams()
  const isNew = id === 'new'
  const existing = snapshot.testimonials.find((t) => t.id === id) ?? null
  const items = snapshot.testimonials.map((t) => ({ id: t.id, label: t.customerName, sublabel: t.context }))

  const blank: Testimonial = {
    id: `t-${Date.now()}`,
    customerName: 'New testimonial',
    quote: '',
    context: '',
    learnerGrade: null,
    sourceDate: '2026-01-01',
    featured: false,
    sortOrder: snapshot.testimonials.length + 1,
    published: true,
  }

  return (
    <CollectionEditorLayout title="Testimonials" basePath="/testimonials" items={items} newLabel="New testimonial">
      {!isNew && !existing ? (
        <StatePanel eyebrow="404" title="Testimonial not found" />
      ) : (
        <Editor key={existing?.id ?? 'new'} snapshot={snapshot} initial={existing ?? blank} onSave={onSave} saving={saving} />
      )}
    </CollectionEditorLayout>
  )
}

function Editor({
  snapshot,
  initial,
  onSave,
  saving,
}: {
  snapshot: CmsSnapshot
  initial: Testimonial
  onSave: (testimonial: Testimonial) => Promise<Testimonial | null>
  saving: boolean
}) {
  const [draft, setDraft] = useState<Testimonial>(initial)
  const patch = (next: Partial<Testimonial>) => setDraft((current) => ({ ...current, ...next }))
  const save = async () => {
    const saved = await onSave(draft)
    if (saved) setDraft(saved)
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Testimonial editor</Eyebrow>
          <h2>{draft.customerName}</h2>
        </div>
        <button type="button" onClick={() => void save()} disabled={saving} className={SOLID_BTN}>
          {saving ? 'Saving…' : 'Save testimonial'}
        </button>
      </div>

      <section className={`grid max-w-[760px] gap-4 p-6 ${CARD}`}>
        <Field label="Customer display name">
          <input className={FIELD} value={draft.customerName} onChange={(e) => patch({ customerName: e.target.value })} />
        </Field>
        <Field label="Quote">
          <textarea className={`${FIELD} min-h-[110px] resize-y`} value={draft.quote} onChange={(e) => patch({ quote: e.target.value })} />
        </Field>
        <Field label="Context / result">
          <input className={FIELD} value={draft.context} onChange={(e) => patch({ context: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Learner grade"
            value={draft.learnerGrade ?? NONE}
            options={[NONE, ...snapshot.valueLists.grades]}
            onChange={(v) => patch({ learnerGrade: v === NONE ? null : (v as Grade) })}
          />
          <Field label="Source date">
            <input className={FIELD} type="date" value={draft.sourceDate} onChange={(e) => patch({ sourceDate: e.target.value })} />
          </Field>
          <Field label="Sort order">
            <input className={FIELD} type="number" value={draft.sortOrder} onChange={(e) => patch({ sortOrder: Number(e.target.value || 0) })} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-[0.92rem]">
            <input type="checkbox" checked={draft.published} onChange={(e) => patch({ published: e.target.checked })} />
            Published
          </label>
          <label className="flex items-center gap-2 text-[0.92rem]">
            <input type="checkbox" checked={draft.featured} onChange={(e) => patch({ featured: e.target.checked })} />
            Featured
          </label>
        </div>
      </section>
    </>
  )
}
