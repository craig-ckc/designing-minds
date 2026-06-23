import { type ReactNode, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  type CmsSnapshot,
  type Grade,
  type Product,
  type ProductFile,
  type ProductKind,
  type ResourceFormat,
  type Term,
} from '@designing-minds/cms'
import { Field, Icon, SelectField, StatePanel } from '../components/ui'
import { KindPill, Pill } from '../components/Badge'
import { CollectionEditorLayout } from '../components/CollectionEditorLayout'
import { FIELD, SOLID_BTN } from '../components/tokens'
import { supabase } from '../lib/supabase'
import { apiUrl } from '../lib/api'

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

function FileList({
  title,
  files,
  onAdd,
  onUpload,
  onRemove,
}: {
  title: string
  files: ProductFile[]
  onAdd: () => void
  onUpload: (file: File) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[0.92rem] font-medium">{title}</span>
        <button type="button" onClick={onAdd} className="text-[0.85rem] underline underline-offset-4">
          Add file
        </button>
        <label className="cursor-pointer text-[0.85rem] underline underline-offset-4">
          Upload
          <input className="sr-only" type="file" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])} />
        </label>
      </div>
      {files.length === 0 ? (
        <p className="text-[0.85rem] text-muted">No files attached.</p>
      ) : (
        <ul className="grid gap-1.5">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-3 border border-line px-3 py-2 text-[0.9rem]">
              <span className="grid min-w-0 gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 text-muted">
                    <Icon name="doc" />
                  </span>
                  {file.label} · {file.filename}
                </span>
                <span className="truncate pl-6 text-[0.78rem] text-muted">{file.storageKey ?? 'No storage key yet'}</span>
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

function Section({ title, children, divided }: { title: string; children: ReactNode; divided?: boolean }) {
  return (
    <section className={`grid gap-4 ${divided ? 'border-t border-line pt-6' : ''}`}>
      <h3 className="text-[1.05rem]">{title}</h3>
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
    id: crypto.randomUUID(),
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

  const addFile = () =>
    setDraft((current) => ({
      ...current,
      purchasedFiles: [
        ...current.purchasedFiles,
        {
          id: `f-${Date.now()}`,
          label: 'New file',
          filename: 'file.pdf',
          storageKey: `products/${current.id}/f-${Date.now()}-file.pdf`,
        },
      ],
    }))
  const removeFile = (fileId: string) =>
    setDraft((current) => ({ ...current, purchasedFiles: current.purchasedFiles.filter((f) => f.id !== fileId) }))

  const uploadFile = async (file: File) => {
    const fileId = `f-${Date.now()}`
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Admin session required.')
    const response = await fetch(apiUrl('/api/admin/upload-url'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId: draft.id, fileId, filename: file.name }),
    })
    const body = (await response.json()) as { uploadUrl?: string; storageKey?: string; error?: string }
    if (!response.ok || !body.uploadUrl || !body.storageKey) throw new Error(body.error ?? 'Unable to create upload URL.')
    const storageKey = body.storageKey
    const upload = await fetch(body.uploadUrl, { method: 'PUT', body: file })
    if (!upload.ok) throw new Error('Unable to upload file.')
    setDraft((current) => ({
      ...current,
      purchasedFiles: [...current.purchasedFiles, { id: fileId, label: file.name, filename: file.name, storageKey }],
    }))
  }

  const save = async () => {
    const saved = await onSave(draft)
    if (saved) setDraft(saved)
  }

  return (
    <>
      {/* Publish bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-line pb-5">
        <Link to="/products" className="grid h-8 w-8 flex-none place-items-center rounded-md text-ink-soft hover:bg-surface-alt">
          <span className="h-4 w-4">
            <Icon name="back" />
          </span>
        </Link>
        <div className="flex items-center gap-2.5">
          <h2 className="text-[1.4rem]">{draft.title}</h2>
          <KindPill kind={draft.productKind} />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Pill tone={draft.published ? 'solid' : 'muted'}>{draft.published ? 'Published' : 'Draft'}</Pill>
          <button type="button" onClick={() => void save()} disabled={saving} className={SOLID_BTN}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid max-w-[760px] gap-8">
        {/* Basic info */}
        <Section title="Basic info">
          <Field label="Name">
            <input className={FIELD} value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
          <Field label="Slug">
            <input className={FIELD} value={draft.slug} onChange={(e) => patch({ slug: e.target.value })} />
          </Field>
          <div className="flex items-center gap-2 rounded-md border border-line bg-surface-alt px-3 py-2 text-[0.82rem] text-muted">
            <span className="h-3.5 w-3.5 flex-none">
              <Icon name="external" />
            </span>
            www.designingminds.co.za/product/{draft.slug || 'your-slug'}
          </div>
          <Field label="Short description">
            <textarea className={`${FIELD} min-h-[70px] resize-y`} value={draft.shortDescription} onChange={(e) => patch({ shortDescription: e.target.value })} />
          </Field>
          <Field label="Full description">
            <textarea className={`${FIELD} min-h-[160px] resize-y`} value={draft.fullDescription} onChange={(e) => patch({ fullDescription: e.target.value })} />
          </Field>
        </Section>

        {/* Custom fields */}
        <Section title="Pricing &amp; visibility" divided>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (ZAR)">
              <input className={FIELD} type="number" value={draft.priceZar} onChange={(e) => patch({ priceZar: Number(e.target.value || 0) })} />
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
        </Section>

        <Section title="Classification" divided>
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
        </Section>

        {isBundle ? (
          <Section title="Bundle details" divided>
            <SelectField label="Bundle scope" value={draft.bundleScope ?? 'Term'} options={['Term', 'Full Year']} onChange={(v) => patch({ bundleScope: v as 'Term' | 'Full Year' })} />
            <CheckGroup label="Included products (Individual Resources)" options={resourceOptions} selected={draft.includedProductSlugs ?? []} onToggle={(v) => toggleIn('includedProductSlugs', v)} />
            <CheckGroup label="Included subjects" options={subjectOptions} selected={draft.includedSubjects ?? []} onToggle={(v) => toggleIn('includedSubjects', v)} />
            <CheckGroup label="Included terms" options={cf.terms.map((t) => ({ value: t, label: t }))} selected={draft.includedTerms ?? []} onToggle={(v) => toggleIn('includedTerms', v)} />
          </Section>
        ) : null}

        {isPlan ? (
          <Section title="Access plan details" divided>
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
          </Section>
        ) : null}

        {!isBundle && !isPlan ? (
          <Section title="Files" divided>
            <FileList title="Purchased files" files={draft.purchasedFiles} onAdd={addFile} onUpload={(file) => void uploadFile(file)} onRemove={removeFile} />
          </Section>
        ) : null}

        <Section title="Related FAQs" divided>
          <CheckGroup label="FAQs referenced by this product" options={faqOptions} selected={draft.faqs} onToggle={(v) => toggleIn('faqs', v)} />
        </Section>

        <Section title="SEO" divided>
          <Field label="Meta title">
            <input className={FIELD} value={draft.seo.title} onChange={(e) => patch({ seo: { ...draft.seo, title: e.target.value } })} />
          </Field>
          <Field label="Meta description">
            <textarea className={`${FIELD} min-h-[80px] resize-y`} value={draft.seo.description} onChange={(e) => patch({ seo: { ...draft.seo, description: e.target.value } })} />
          </Field>
        </Section>
      </div>
    </>
  )
}
