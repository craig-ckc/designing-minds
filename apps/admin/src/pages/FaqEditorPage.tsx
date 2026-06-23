import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { type CmsSnapshot, type Faq } from '@designing-minds/cms'
import { Eyebrow, Field, StatePanel } from '../components/ui'
import { CollectionEditorLayout } from '../components/CollectionEditorLayout'
import { CARD, FIELD, SOLID_BTN } from '../components/tokens'

export function FaqEditorPage({
  snapshot,
  onSave,
  saving,
}: {
  snapshot: CmsSnapshot
  onSave: (faq: Faq) => Promise<Faq | null>
  saving: boolean
}) {
  const { id } = useParams()
  const isNew = id === 'new'
  const existing = snapshot.faqs.find((f) => f.id === id) ?? null
  const items = snapshot.faqs.map((f) => ({ id: f.id, label: f.question, sublabel: f.category }))

  const blank: Faq = {
    id: crypto.randomUUID(),
    question: 'New question',
    answer: '',
    category: 'General',
    sortOrder: snapshot.faqs.length + 1,
    published: true,
  }

  return (
    <CollectionEditorLayout title="FAQs" basePath="/faqs" items={items} newLabel="New FAQ">
      {!isNew && !existing ? (
        <StatePanel eyebrow="404" title="FAQ not found" />
      ) : (
        <Editor key={existing?.id ?? 'new'} initial={existing ?? blank} onSave={onSave} saving={saving} />
      )}
    </CollectionEditorLayout>
  )
}

function Editor({ initial, onSave, saving }: { initial: Faq; onSave: (faq: Faq) => Promise<Faq | null>; saving: boolean }) {
  const [draft, setDraft] = useState<Faq>(initial)
  const patch = (next: Partial<Faq>) => setDraft((current) => ({ ...current, ...next }))
  const save = async () => {
    const saved = await onSave(draft)
    if (saved) setDraft(saved)
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>FAQ editor</Eyebrow>
          <h2 className="max-w-[640px]">{draft.question}</h2>
        </div>
        <button type="button" onClick={() => void save()} disabled={saving} className={SOLID_BTN}>
          {saving ? 'Saving…' : 'Save FAQ'}
        </button>
      </div>

      <section className={`grid gap-4 p-6 ${CARD}`}>
        <Field label="Question">
          <input className={FIELD} value={draft.question} onChange={(e) => patch({ question: e.target.value })} />
        </Field>
        <Field label="Answer">
          <textarea className={`${FIELD} min-h-[160px] resize-y`} value={draft.answer} onChange={(e) => patch({ answer: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <input className={FIELD} value={draft.category} onChange={(e) => patch({ category: e.target.value })} />
          </Field>
          <Field label="Sort order">
            <input className={FIELD} type="number" value={draft.sortOrder} onChange={(e) => patch({ sortOrder: Number(e.target.value || 0) })} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-[0.92rem]">
          <input type="checkbox" checked={draft.published} onChange={(e) => patch({ published: e.target.checked })} />
          Published
        </label>
      </section>
    </>
  )
}
