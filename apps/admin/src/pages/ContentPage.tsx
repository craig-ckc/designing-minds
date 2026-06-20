import { startTransition, useDeferredValue, useState } from 'react'
import { toParagraphs, type CmsPage, type CmsSnapshot } from '@designing-minds/cms'
import { Eyebrow, PageHeader } from '../components/ui'
import { CARD, FIELD, SOLID_BTN } from '../components/tokens'

export function ContentPage({
  snapshot,
  onSave,
  saving,
}: {
  snapshot: CmsSnapshot
  onSave: (page: CmsPage) => Promise<CmsPage | null>
  saving: boolean
}) {
  const [selectedId, setSelectedId] = useState<number | null>(snapshot.pages[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const filtered = snapshot.pages.filter((page) => {
    const query = deferredSearch.trim().toLowerCase()
    return !query || `${page.title} ${page.slug}`.toLowerCase().includes(query)
  })

  const activePage = snapshot.pages.find((page) => page.id === selectedId) ?? null

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Pages"
        description="Edit the static pages that appear on the public website."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="grid content-start gap-3">
          <input
            className={FIELD}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find by title or slug…"
          />
          <div className="grid max-h-[70vh] gap-2 overflow-auto">
            {filtered.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => startTransition(() => setSelectedId(page.id))}
                className={`grid rounded-md border px-3 py-2.5 text-left transition ${
                  selectedId === page.id ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink'
                }`}
              >
                <strong className="text-[0.92rem] font-medium">{page.title}</strong>
                <span className={`text-[0.8rem] ${selectedId === page.id ? 'text-white/70' : 'text-muted'}`}>
                  {page.slug}
                </span>
              </button>
            ))}
            {filtered.length === 0 ? <p className="text-[0.9rem] text-muted">No pages match.</p> : null}
          </div>
        </aside>

        {activePage ? (
          <PageEditor key={`${activePage.id}:${activePage.modified}`} page={activePage} onSave={onSave} saving={saving} />
        ) : (
          <div className={`grid place-items-center p-10 text-muted ${CARD}`}>Select a page to start editing.</div>
        )}
      </div>
    </>
  )
}

function PageEditor({
  page,
  onSave,
  saving,
}: {
  page: CmsPage
  onSave: (page: CmsPage) => Promise<CmsPage | null>
  saving: boolean
}) {
  const [draft, setDraft] = useState<CmsPage>(page)
  const patch = (next: Partial<CmsPage>) => setDraft((current) => ({ ...current, ...next }))

  const handleSave = async () => {
    const saved = await onSave(draft)
    if (saved) {
      setDraft(saved)
    }
  }

  return (
    <section className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Page editor</Eyebrow>
          <h3 className="text-[1.5rem]">{draft.title}</h3>
        </div>
        <button type="button" onClick={() => void handleSave()} disabled={saving} className={SOLID_BTN}>
          {saving ? 'Saving…' : 'Save page'}
        </button>
      </div>

      <div className={`grid gap-4 p-6 ${CARD}`}>
        <label className="grid gap-2 text-[0.92rem] font-medium">
          Title
          <input className={FIELD} value={draft.title} onChange={(event) => patch({ title: event.target.value })} />
        </label>
        <label className="grid gap-2 text-[0.92rem] font-medium">
          Slug
          <input className={FIELD} value={draft.slug} onChange={(event) => patch({ slug: event.target.value })} />
        </label>
        <label className="grid gap-2 text-[0.92rem] font-medium">
          Summary
          <textarea
            className={`${FIELD} min-h-[80px] resize-y`}
            value={draft.summary}
            onChange={(event) => patch({ summary: event.target.value })}
          />
        </label>
        <label className="grid gap-2 text-[0.92rem] font-medium">
          Excerpt
          <textarea
            className={`${FIELD} min-h-[100px] resize-y`}
            value={draft.excerpt}
            onChange={(event) => patch({ excerpt: event.target.value })}
          />
        </label>
        <label className="grid gap-2 text-[0.92rem] font-medium">
          Body
          <textarea
            className={`${FIELD} min-h-[320px] resize-y`}
            value={draft.body}
            onChange={(event) => patch({ body: event.target.value })}
          />
        </label>
      </div>

      <div className={`grid gap-3 p-6 ${CARD}`}>
        <Eyebrow className="mb-0">Preview</Eyebrow>
        <h3 className="text-[1.35rem]">{draft.title}</h3>
        {draft.summary ? <p className="text-[1.02rem] text-ink-soft">{draft.summary}</p> : null}
        <div className="grid gap-3 border-t border-line pt-3 text-[0.95rem] text-ink-soft">
          {toParagraphs(draft.body)
            .filter((paragraph) => paragraph !== '-' && paragraph.length > 1)
            .slice(0, 12)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>
      </div>
    </section>
  )
}
