import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toParagraphs, type CmsProduct, type CmsSnapshot } from '@designing-minds/cms'
import { Eyebrow, Icon, Placeholder, StatePanel } from '../components/ui'
import { CARD, FIELD, SOLID_BTN } from '../components/tokens'

function LabelledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-[0.92rem] font-medium">
      {label}
      {children}
    </label>
  )
}

export function ProductEditorPage({
  snapshot,
  onSave,
  saving,
}: {
  snapshot: CmsSnapshot
  onSave: (product: CmsProduct) => Promise<CmsProduct | null>
  saving: boolean
}) {
  const { id } = useParams()
  const product = snapshot.products.find((entry) => entry.id === Number(id)) ?? null

  if (!product) {
    return (
      <StatePanel eyebrow="404" title="Product not found" body="This product is not in the catalogue.">
        <Link to="/products" className="text-ink underline underline-offset-4 hover:opacity-70">
          Back to products
        </Link>
      </StatePanel>
    )
  }

  return <ProductEditor key={`${product.id}:${product.modified}`} product={product} onSave={onSave} saving={saving} />
}

function ProductEditor({
  product,
  onSave,
  saving,
}: {
  product: CmsProduct
  onSave: (product: CmsProduct) => Promise<CmsProduct | null>
  saving: boolean
}) {
  const [draft, setDraft] = useState<CmsProduct>(product)

  const patch = (next: Partial<CmsProduct>) => setDraft((current) => ({ ...current, ...next }))

  const handleSave = async () => {
    const saved = await onSave(draft)
    if (saved) {
      setDraft(saved)
    }
  }

  return (
    <>
      <Link to="/products" className="mb-5 inline-flex items-center gap-1.5 text-[0.9rem] text-ink-soft hover:text-ink">
        <span className="h-4 w-4">
          <Icon name="back" />
        </span>
        Back to products
      </Link>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Product editor</Eyebrow>
          <h2>{draft.title}</h2>
        </div>
        <button type="button" onClick={() => void handleSave()} disabled={saving} className={SOLID_BTN}>
          {saving ? 'Saving…' : 'Save product'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className={`grid gap-4 p-6 ${CARD}`}>
          <LabelledField label="Title">
            <input className={FIELD} value={draft.title} onChange={(event) => patch({ title: event.target.value })} />
          </LabelledField>
          <LabelledField label="Slug">
            <input className={FIELD} value={draft.slug} onChange={(event) => patch({ slug: event.target.value })} />
          </LabelledField>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabelledField label="Grade">
              <input className={FIELD} value={draft.grade} onChange={(event) => patch({ grade: event.target.value })} />
            </LabelledField>
            <LabelledField label="Term">
              <input className={FIELD} value={draft.term} onChange={(event) => patch({ term: event.target.value })} />
            </LabelledField>
            <LabelledField label="Type">
              <input className={FIELD} value={draft.type} onChange={(event) => patch({ type: event.target.value })} />
            </LabelledField>
            <LabelledField label="Primary subject">
              <input
                className={FIELD}
                value={draft.primarySubject}
                onChange={(event) => patch({ primarySubject: event.target.value })}
              />
            </LabelledField>
            <LabelledField label="Year">
              <input
                className={FIELD}
                value={draft.year ?? ''}
                onChange={(event) => patch({ year: event.target.value || null })}
              />
            </LabelledField>
            <LabelledField label="Marks">
              <input
                className={FIELD}
                value={draft.marks ?? ''}
                onChange={(event) => patch({ marks: event.target.value || null })}
              />
            </LabelledField>
          </div>
          <LabelledField label="Subjects (comma separated)">
            <input
              className={FIELD}
              value={draft.subjects.join(', ')}
              onChange={(event) =>
                patch({ subjects: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })
              }
            />
          </LabelledField>
          <LabelledField label="Tags (comma separated)">
            <input
              className={FIELD}
              value={draft.tags.join(', ')}
              onChange={(event) =>
                patch({ tags: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })
              }
            />
          </LabelledField>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabelledField label="Price (ZAR)">
              <input
                className={FIELD}
                type="number"
                value={draft.priceZar}
                onChange={(event) => {
                  const value = Number(event.target.value || 0)
                  patch({ priceZar: value, priceLabel: `R${value.toLocaleString('en-ZA')}` })
                }}
              />
            </LabelledField>
            <LabelledField label="Status">
              <select
                className={FIELD}
                value={draft.status}
                onChange={(event) => patch({ status: event.target.value as CmsProduct['status'] })}
              >
                <option value="fresh">fresh</option>
                <option value="featured">featured</option>
                <option value="evergreen">evergreen</option>
              </select>
            </LabelledField>
          </div>
          <LabelledField label="Excerpt">
            <textarea
              className={`${FIELD} min-h-[110px] resize-y`}
              value={draft.excerpt}
              onChange={(event) => patch({ excerpt: event.target.value })}
            />
          </LabelledField>
          <LabelledField label="Body">
            <textarea
              className={`${FIELD} min-h-[320px] resize-y`}
              value={draft.body}
              onChange={(event) => patch({ body: event.target.value })}
            />
          </LabelledField>
        </section>

        <aside className="grid content-start gap-4">
          <Placeholder label="Sample preview" ratio="4 / 3" />
          <div className={`grid gap-3 p-6 ${CARD}`}>
            <Eyebrow className="mb-0">Preview</Eyebrow>
            <h3 className="text-[1.35rem]">{draft.title}</h3>
            <p className="text-[0.9rem] text-muted">
              {draft.grade} · {draft.term} · {draft.primarySubject} · {draft.priceLabel}
            </p>
            <div className="grid gap-3 border-t border-line pt-3 text-[0.95rem] text-ink-soft">
              {toParagraphs(draft.body)
                .filter((paragraph) => paragraph !== '-' && paragraph.length > 1)
                .slice(0, 6)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
