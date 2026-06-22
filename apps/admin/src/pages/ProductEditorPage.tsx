import { type ReactNode, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  formatCurrency,
  type CmsSnapshot,
  type Grade,
  type Product,
  type ProductFile,
  type ProductKind,
  type ResourceFormat,
  type Term,
} from '@designing-minds/cms'
import { Eyebrow, Field, Icon, Placeholder, SelectField, StatePanel } from '../components/ui'
import { KindPill } from '../components/Badge'
import { CollectionEditorLayout } from '../components/CollectionEditorLayout'
import { CARD, FIELD, SOLID_BTN } from '../components/tokens'

function CheckGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-[0.92rem] font-medium">{label}</legend>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-[0.9rem] text-ink-soft">
            <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} />
            {option.label}
          </label>
        ))}
        {options.length === 0 ? <span className="text-[0.85rem] text-muted">No options yet.</span> : null}
      </div>
    </fieldset>
  )
}

function FileList({ title, files, onAdd, onRemove }: { title: string; files: ProductFile[]; onAdd: () => void; onRemove: (id: string) => void }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[0.92rem] font-medium">{title}</span>
        <button type="button" onClick={onAdd} className="text-[0.85rem] underline underline-offset-4">
          Add file
        </button>
      </div>
      {files.length === 0 ? (
        <p className="text-[0.85rem] text-muted">No files attached.</p>
      ) : (
        <ul className="grid gap-1.5">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-3 border border-line px-3 py-2 text-[0.9rem]">
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 text-muted">
                  <Icon name="doc" />
                </span>
                {file.label} · {file.filename}
              </span>
              <button type="button" onClick={() => onRemove(file.id)} className="text-[0.82rem] text-muted underline underline-offset-4 hover:text-ink">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`grid gap-4 p-6 ${CARD}`}>
      <h3 className="text-[1.2rem]">{title}</h3>
      {children}
    </section>
  )
}

export function ProductEditorPage({
  snapshot,
  onSave,
  saving,
}: {
  snapshot: CmsSnapshot
  onSave: (product: Product) => Promise<Product | null>
  saving: boolean
}) {
  const { id } = useParams()
  const cf = snapshot.valueLists
  const isNew = id === 'new'
  const existing = snapshot.products.find((p) => p.id === id) ?? null
  const items = snapshot.products.map((p) => ({ id: p.id, label: p.title, sublabel: `${p.grade} · ${p.productKind}` }))

  const blank: Product = {
    id: `p-${Date.now()}`,
    slug: '',
    title: 'New product',
    shortDescription: '',
    fullDescription: '',
    priceZar: 0,
    grade: cf.grades[0],
    term: cf.terms[0],
    year: cf.years[0] ?? '2026',
    productKind: 'Individual Resource',
    resourceFormat: cf.resourceFormats[0],
    subjects: [],
    marks: null,
    previewFiles: [],
    purchasedFiles: [],
    featured: false,
    published: false,
    sortOrder: snapshot.products.length + 1,
    seo: { title: '', description: '' },
    faqs: [],
    updatedAt: '',
  }

  return (
    <CollectionEditorLayout title="Products" basePath="/products" items={items} newLabel="New product">
      {!isNew && !existing ? (
        <StatePanel eyebrow="404" title="Product not found" body="This product is not in the catalogue." />
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
  initial: Product
  onSave: (product: Product) => Promise<Product | null>
  saving: boolean
}) {
  const cf = snapshot.valueLists
  const [draft, setDraft] = useState<Product>(initial)
  const patch = (next: Partial<Product>) => setDraft((current) => ({ ...current, ...next }))
  const toggleIn = (key: 'subjects' | 'faqs' | 'includedProductSlugs' | 'includedSubjects' | 'includedTerms' | 'includedGrades', value: string) =>
    setDraft((current) => {
      const list = (current[key] as string[] | undefined) ?? []
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
      return { ...current, [key]: next }
    })

  const subjectOptions = snapshot.subjects.map((s) => ({ value: s.slug, label: s.name }))
  const faqOptions = snapshot.faqs.map((f) => ({ value: f.id, label: f.question }))
  const resourceOptions = snapshot.products
    .filter((p) => p.productKind === 'Individual Resource')
    .map((p) => ({ value: p.slug, label: p.title }))

  const isBundle = draft.productKind === 'Bundle'
  const isPlan = draft.productKind === 'Access Plan'

  const addFile = (key: 'previewFiles' | 'purchasedFiles') =>
    setDraft((current) => ({
      ...current,
      [key]: [...current[key], { id: `f-${Date.now()}`, label: 'New file', filename: 'file.pdf' }],
    }))
  const removeFile = (key: 'previewFiles' | 'purchasedFiles', fileId: string) =>
    setDraft((current) => ({ ...current, [key]: current[key].filter((f) => f.id !== fileId) }))

  const save = async () => {
    const saved = await onSave(draft)
    if (saved) setDraft(saved)
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Product editor</Eyebrow>
          <div className="flex items-center gap-3">
            <h2>{draft.title}</h2>
            <KindPill kind={draft.productKind} />
          </div>
        </div>
        <button type="button" onClick={() => void save()} disabled={saving} className={SOLID_BTN}>
          {saving ? 'Saving…' : 'Save product'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-8">
          <Card title="Basics">
            <Field label="Title">
              <input className={FIELD} value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <Field label="Slug">
              <input className={FIELD} value={draft.slug} onChange={(e) => patch({ slug: e.target.value })} />
            </Field>
            <Field label="Short description">
              <textarea className={`${FIELD} min-h-[70px] resize-y`} value={draft.shortDescription} onChange={(e) => patch({ shortDescription: e.target.value })} />
            </Field>
            <Field label="Full description">
              <textarea className={`${FIELD} min-h-[160px] resize-y`} value={draft.fullDescription} onChange={(e) => patch({ fullDescription: e.target.value })} />
            </Field>
          </Card>

          <Card title="Classification">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Product kind" value={draft.productKind} options={cf.productKinds} onChange={(v) => patch({ productKind: v as ProductKind })} />
              <SelectField label="Resource format" value={draft.resourceFormat} options={cf.resourceFormats} onChange={(v) => patch({ resourceFormat: v as ResourceFormat })} />
              <SelectField label="Grade" value={draft.grade} options={cf.grades} onChange={(v) => patch({ grade: v as Grade })} />
              <SelectField label="Term" value={draft.term} options={cf.terms} onChange={(v) => patch({ term: v as Term })} />
              <SelectField label="Year" value={draft.year} options={cf.years} onChange={(v) => patch({ year: v })} />
              <Field label="Marks">
                <input
                  className={FIELD}
                  type="number"
                  value={draft.marks ?? ''}
                  onChange={(e) => patch({ marks: e.target.value ? Number(e.target.value) : null })}
                />
              </Field>
            </div>
            <CheckGroup label="Subjects (at least one)" options={subjectOptions} selected={draft.subjects} onToggle={(v) => toggleIn('subjects', v)} />
          </Card>

          {isBundle ? (
            <Card title="Bundle details">
              <SelectField label="Bundle scope" value={draft.bundleScope ?? 'Term'} options={['Term', 'Full Year']} onChange={(v) => patch({ bundleScope: v as 'Term' | 'Full Year' })} />
              <CheckGroup label="Included products (Individual Resources)" options={resourceOptions} selected={draft.includedProductSlugs ?? []} onToggle={(v) => toggleIn('includedProductSlugs', v)} />
              <CheckGroup label="Included subjects" options={subjectOptions} selected={draft.includedSubjects ?? []} onToggle={(v) => toggleIn('includedSubjects', v)} />
              <CheckGroup label="Included terms" options={cf.terms.map((t) => ({ value: t, label: t }))} selected={draft.includedTerms ?? []} onToggle={(v) => toggleIn('includedTerms', v)} />
            </Card>
          ) : null}

          {isPlan ? (
            <Card title="Access plan details">
              <SelectField label="Access period" value={draft.accessPeriod ?? 'Term'} options={['Term', 'Year']} onChange={(v) => patch({ accessPeriod: v as 'Term' | 'Year' })} />
              <CheckGroup label="Included grades" options={cf.grades.map((g) => ({ value: g, label: g }))} selected={draft.includedGrades ?? []} onToggle={(v) => toggleIn('includedGrades', v)} />
              <CheckGroup label="Included subjects" options={subjectOptions} selected={draft.includedSubjects ?? []} onToggle={(v) => toggleIn('includedSubjects', v)} />
              <CheckGroup label="Included terms" options={cf.terms.map((t) => ({ value: t, label: t }))} selected={draft.includedTerms ?? []} onToggle={(v) => toggleIn('includedTerms', v)} />
              <CheckGroup label="Included products" options={resourceOptions} selected={draft.includedProductSlugs ?? []} onToggle={(v) => toggleIn('includedProductSlugs', v)} />
              <Field label="Delivery rules">
                <textarea className={`${FIELD} min-h-[70px] resize-y`} value={draft.deliveryRules ?? ''} onChange={(e) => patch({ deliveryRules: e.target.value })} />
              </Field>
              <Field label="Renewal / expiry notes">
                <textarea className={`${FIELD} min-h-[70px] resize-y`} value={draft.renewalNotes ?? ''} onChange={(e) => patch({ renewalNotes: e.target.value })} />
              </Field>
            </Card>
          ) : null}

          {!isBundle && !isPlan ? (
            <Card title="Files">
              <FileList title="Preview files" files={draft.previewFiles} onAdd={() => addFile('previewFiles')} onRemove={(fid) => removeFile('previewFiles', fid)} />
              <FileList title="Purchased files" files={draft.purchasedFiles} onAdd={() => addFile('purchasedFiles')} onRemove={(fid) => removeFile('purchasedFiles', fid)} />
            </Card>
          ) : null}

          <Card title="Related FAQs">
            <CheckGroup label="FAQs referenced by this product" options={faqOptions} selected={draft.faqs} onToggle={(v) => toggleIn('faqs', v)} />
          </Card>
        </div>

        <aside className="grid content-start gap-4">
          <div className={`grid gap-4 p-6 ${CARD}`}>
            <h3 className="text-[1.2rem]">Pricing &amp; visibility</h3>
            <Field label="Price (ZAR)">
              <input className={FIELD} type="number" value={draft.priceZar} onChange={(e) => patch({ priceZar: Number(e.target.value || 0) })} />
            </Field>
            <Field label="Sort order">
              <input className={FIELD} type="number" value={draft.sortOrder} onChange={(e) => patch({ sortOrder: Number(e.target.value || 0) })} />
            </Field>
            <label className="flex items-center gap-2 text-[0.92rem]">
              <input type="checkbox" checked={draft.published} onChange={(e) => patch({ published: e.target.checked })} />
              Published
            </label>
            <label className="flex items-center gap-2 text-[0.92rem]">
              <input type="checkbox" checked={draft.featured} onChange={(e) => patch({ featured: e.target.checked })} />
              Featured
            </label>
          </div>

          <Placeholder label="Card preview" ratio="4 / 3" />
          <div className={`grid gap-2 p-6 ${CARD}`}>
            <Eyebrow className="mb-0">Preview</Eyebrow>
            <h3 className="text-[1.2rem]">{draft.title}</h3>
            <p className="text-[0.9rem] text-muted">
              {draft.grade} · {draft.term} · {draft.resourceFormat} · {formatCurrency(draft.priceZar)}
            </p>
            <p className="border-t border-line pt-3 text-[0.92rem] text-ink-soft">{draft.shortDescription}</p>
          </div>

          <div className={`grid gap-4 p-6 ${CARD}`}>
            <h3 className="text-[1.2rem]">SEO</h3>
            <Field label="Meta title">
              <input className={FIELD} value={draft.seo.title} onChange={(e) => patch({ seo: { ...draft.seo, title: e.target.value } })} />
            </Field>
            <Field label="Meta description">
              <textarea className={`${FIELD} min-h-[80px] resize-y`} value={draft.seo.description} onChange={(e) => patch({ seo: { ...draft.seo, description: e.target.value } })} />
            </Field>
          </div>
        </aside>
      </div>
    </>
  )
}
