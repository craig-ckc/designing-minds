import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { type CmsSnapshot, type Subject } from '@designing-minds/cms'
import { Eyebrow, Field, StatePanel } from '../components/ui'
import { CollectionEditorLayout } from '../components/CollectionEditorLayout'
import { CARD, FIELD, SOLID_BTN } from '../components/tokens'

export function SubjectEditorPage({
  snapshot,
  onSave,
  saving,
}: {
  snapshot: CmsSnapshot
  onSave: (subject: Subject) => Promise<Subject | null>
  saving: boolean
}) {
  const { id } = useParams()
  const isNew = id === 'new'
  const existing = snapshot.subjects.find((s) => s.id === id) ?? null
  const items = snapshot.subjects.map((s) => ({ id: s.id, label: s.name, sublabel: s.slug }))

  const blank: Subject = {
    id: crypto.randomUUID(),
    slug: '',
    name: 'New subject',
    shortLabel: '',
    description: '',
    sortOrder: snapshot.subjects.length + 1,
    visible: true,
    faqs: [],
  }

  return (
    <CollectionEditorLayout title="Subjects" basePath="/subjects" items={items} newLabel="New subject">
      {!isNew && !existing ? (
        <StatePanel eyebrow="404" title="Subject not found" />
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
  initial: Subject
  onSave: (subject: Subject) => Promise<Subject | null>
  saving: boolean
}) {
  const [draft, setDraft] = useState<Subject>(initial)
  const patch = (next: Partial<Subject>) => setDraft((current) => ({ ...current, ...next }))
  const toggleFaq = (faqId: string) =>
    setDraft((current) => ({
      ...current,
      faqs: current.faqs.includes(faqId) ? current.faqs.filter((f) => f !== faqId) : [...current.faqs, faqId],
    }))

  const save = async () => {
    const saved = await onSave(draft)
    if (saved) setDraft(saved)
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Subject editor</Eyebrow>
          <h2>{draft.name}</h2>
        </div>
        <button type="button" onClick={() => void save()} disabled={saving} className={SOLID_BTN}>
          {saving ? 'Saving…' : 'Save subject'}
        </button>
      </div>

      <div className="grid gap-6">
        <section className={`grid gap-4 p-6 ${CARD}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input className={FIELD} value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="Short label">
              <input className={FIELD} value={draft.shortLabel} onChange={(e) => patch({ shortLabel: e.target.value })} />
            </Field>
            <Field label="Slug">
              <input className={FIELD} value={draft.slug} onChange={(e) => patch({ slug: e.target.value })} />
            </Field>
            <Field label="Sort order">
              <input className={FIELD} type="number" value={draft.sortOrder} onChange={(e) => patch({ sortOrder: Number(e.target.value || 0) })} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className={`${FIELD} min-h-[110px] resize-y`} value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-[0.92rem]">
            <input type="checkbox" checked={draft.visible} onChange={(e) => patch({ visible: e.target.checked })} />
            Visible on the website
          </label>
        </section>

        <section className={`grid gap-3 p-6 ${CARD}`}>
          <h3 className="text-[1.2rem]">Related FAQs</h3>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {snapshot.faqs.map((faq) => (
              <label key={faq.id} className="flex items-center gap-2 text-[0.9rem] text-ink-soft">
                <input type="checkbox" checked={draft.faqs.includes(faq.id)} onChange={() => toggleFaq(faq.id)} />
                {faq.question}
              </label>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
