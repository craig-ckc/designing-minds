import {
  startTransition,
  type ReactNode,
  useDeferredValue,
  useEffect,
  useState,
} from 'react'
import {
  createCmsRepository,
  toParagraphs,
  updatePageInSnapshot,
  updateProductInSnapshot,
  type CmsPage,
  type CmsProduct,
  type CmsSnapshot,
} from '@designing-minds/cms'

const repository = createCmsRepository({
  app: 'admin',
  provider: import.meta.env.VITE_CMS_PROVIDER,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
})

type EditorTab = 'pages' | 'products'

function App() {
  const [snapshot, setSnapshot] = useState<CmsSnapshot | null>(null)
  const [activeTab, setActiveTab] = useState<EditorTab>('pages')
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const nextSnapshot = await repository.getSnapshot()
        if (cancelled) {
          return
        }

        setSnapshot(nextSnapshot)
        setSelectedPageId((current) => current ?? nextSnapshot.pages[0]?.id ?? null)
        setSelectedProductId((current) => current ?? nextSnapshot.products[0]?.id ?? null)
        setError(null)
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load CMS content.')
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredPages = snapshot?.pages.filter((page) => {
    const query = deferredSearch.trim().toLowerCase()
    return !query || `${page.title} ${page.slug}`.toLowerCase().includes(query)
  }) ?? []

  const filteredProducts = snapshot?.products.filter((product) => {
    const query = deferredSearch.trim().toLowerCase()
    return !query || `${product.title} ${product.slug} ${product.primarySubject}`.toLowerCase().includes(query)
  }) ?? []

  const activePage = snapshot?.pages.find((page) => page.id === selectedPageId) ?? null
  const activeProduct = snapshot?.products.find((product) => product.id === selectedProductId) ?? null

  const savePage = async (pageDraft: CmsPage) => {
    if (!snapshot || !repository.canWrite) {
      return null
    }

    setSaving(true)
    try {
      const saved = await repository.savePage(pageDraft)
      setSnapshot(updatePageInSnapshot(snapshot, saved))
      setMessage(`Saved page: ${saved.title}`)
      setError(null)
      return saved
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save page.')
      return null
    } finally {
      setSaving(false)
    }
  }

  const saveProduct = async (productDraft: CmsProduct) => {
    if (!snapshot || !repository.canWrite) {
      return null
    }

    setSaving(true)
    try {
      const saved = await repository.saveProduct(productDraft)
      setSnapshot(updateProductInSnapshot(snapshot, saved))
      setMessage(`Saved product: ${saved.title}`)
      setError(null)
      return saved
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save product.')
      return null
    } finally {
      setSaving(false)
    }
  }

  const resetContent = async () => {
    if (!repository.reset) {
      return
    }

    setSaving(true)
    try {
      await repository.reset()
      const nextSnapshot = await repository.getSnapshot()
      setSnapshot(nextSnapshot)
      setMessage('Content reset to the generated seed snapshot.')
      setError(null)
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to reset CMS content.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell>
      <section className="panel banner">
        <div>
          <p className="eyebrow">CMS workspace</p>
          <h1>Admin App</h1>
          <p>
            Default mode is <strong>{repository.mode}</strong>. Local mode is useful for wireframing and content rehearsals. Shared live editing between this app and the website requires Supabase.
          </p>
        </div>
        <div className="badge-row">
          <span className="badge">Write access: {repository.canWrite ? 'Enabled' : 'Read only'}</span>
          <button className="ghost-button" type="button" onClick={() => void resetContent()} disabled={saving}>
            Reset content
          </button>
        </div>
      </section>

      {error ? (
        <section className="panel">
          <h2>Problem loading content</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {message ? (
        <section className="panel">
          <p>{message}</p>
        </section>
      ) : null}

      <div className="admin-grid">
        <aside className="panel">
          <div className="tab-row">
            <button
              className={activeTab === 'pages' ? 'tab-button active' : 'tab-button'}
              type="button"
              onClick={() => setActiveTab('pages')}
            >
              Pages
            </button>
            <button
              className={activeTab === 'products' ? 'tab-button active' : 'tab-button'}
              type="button"
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
          </div>

          <label>
            Search content
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find by title, slug, subject..." />
          </label>

          <div className="record-list">
            {activeTab === 'pages'
              ? filteredPages.map((page) => (
                  <button
                    key={page.id}
                    className={selectedPageId === page.id ? 'record-button active' : 'record-button'}
                    type="button"
                    onClick={() =>
                      startTransition(() => {
                        setSelectedPageId(page.id)
                      })
                    }
                  >
                    <strong>{page.title}</strong>
                    <span>{page.slug}</span>
                  </button>
                ))
              : filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    className={selectedProductId === product.id ? 'record-button active' : 'record-button'}
                    type="button"
                    onClick={() =>
                      startTransition(() => {
                        setSelectedProductId(product.id)
                      })
                    }
                  >
                    <strong>{product.title}</strong>
                    <span>
                      {product.grade} · {product.term}
                    </span>
                  </button>
                ))}
          </div>
        </aside>

        <section className="stack">
          {activeTab === 'pages' ? (
            <PageEditor
              key={activePage ? `${activePage.id}:${activePage.modified}` : 'page-empty'}
              page={activePage}
              onSave={savePage}
              saving={saving}
            />
          ) : (
            <ProductEditor
              key={activeProduct ? `${activeProduct.id}:${activeProduct.modified}` : 'product-empty'}
              product={activeProduct}
              onSave={saveProduct}
              saving={saving}
            />
          )}
        </section>
      </div>
    </AdminShell>
  )
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="panel shell-header">
        <div>
          <p className="eyebrow">Designing Minds</p>
          <h2>Content Admin</h2>
        </div>
        <a className="button-link subtle" href="http://localhost:5173" target="_blank" rel="noreferrer">
          Open website
        </a>
      </header>
      {children}
    </div>
  )
}

function PageEditor({
  page,
  onSave,
  saving,
}: {
  page: CmsPage | null
  onSave: (pageDraft: CmsPage) => Promise<CmsPage | null>
  saving: boolean
}) {
  const [pageDraft, setPageDraft] = useState(page)

  if (!pageDraft) {
    return (
      <section className="panel">
        <p>Select a page to start editing.</p>
      </section>
    )
  }

  return (
    <>
      <section className="panel form-grid">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Page editor</p>
            <h2>{pageDraft.title}</h2>
          </div>
          <button
            className="button-link"
            type="button"
            onClick={async () => {
              const saved = await onSave(pageDraft)
              if (saved) {
                setPageDraft(saved)
              }
            }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save page'}
          </button>
        </div>

        <Field label="Title">
          <input value={pageDraft.title} onChange={(event) => setPageDraft((current) => current ? { ...current, title: event.target.value } : current)} />
        </Field>
        <Field label="Slug">
          <input value={pageDraft.slug} onChange={(event) => setPageDraft((current) => current ? { ...current, slug: event.target.value } : current)} />
        </Field>
        <Field label="Summary">
          <textarea value={pageDraft.summary} onChange={(event) => setPageDraft((current) => current ? { ...current, summary: event.target.value } : current)} rows={3} />
        </Field>
        <Field label="Excerpt">
          <textarea value={pageDraft.excerpt} onChange={(event) => setPageDraft((current) => current ? { ...current, excerpt: event.target.value } : current)} rows={4} />
        </Field>
        <Field label="Body">
          <textarea value={pageDraft.body} onChange={(event) => setPageDraft((current) => current ? { ...current, body: event.target.value } : current)} rows={14} />
        </Field>
      </section>

      <section className="panel">
        <p className="eyebrow">Preview</p>
        <h3>{pageDraft.title}</h3>
        {toParagraphs(pageDraft.body).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
    </>
  )
}

function ProductEditor({
  product,
  onSave,
  saving,
}: {
  product: CmsProduct | null
  onSave: (productDraft: CmsProduct) => Promise<CmsProduct | null>
  saving: boolean
}) {
  const [productDraft, setProductDraft] = useState(product)

  if (!productDraft) {
    return (
      <section className="panel">
        <p>Select a product to start editing.</p>
      </section>
    )
  }

  return (
    <>
      <section className="panel form-grid">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Product editor</p>
            <h2>{productDraft.title}</h2>
          </div>
          <button
            className="button-link"
            type="button"
            onClick={async () => {
              const saved = await onSave(productDraft)
              if (saved) {
                setProductDraft(saved)
              }
            }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save product'}
          </button>
        </div>

        <Field label="Title">
          <input value={productDraft.title} onChange={(event) => setProductDraft((current) => current ? { ...current, title: event.target.value } : current)} />
        </Field>
        <Field label="Slug">
          <input value={productDraft.slug} onChange={(event) => setProductDraft((current) => current ? { ...current, slug: event.target.value } : current)} />
        </Field>
        <Field label="Grade">
          <input value={productDraft.grade} onChange={(event) => setProductDraft((current) => current ? { ...current, grade: event.target.value } : current)} />
        </Field>
        <Field label="Term">
          <input value={productDraft.term} onChange={(event) => setProductDraft((current) => current ? { ...current, term: event.target.value } : current)} />
        </Field>
        <Field label="Type">
          <input value={productDraft.type} onChange={(event) => setProductDraft((current) => current ? { ...current, type: event.target.value } : current)} />
        </Field>
        <Field label="Primary subject">
          <input value={productDraft.primarySubject} onChange={(event) => setProductDraft((current) => current ? { ...current, primarySubject: event.target.value } : current)} />
        </Field>
        <Field label="Subjects (comma separated)">
          <input
            value={productDraft.subjects.join(', ')}
            onChange={(event) =>
              setProductDraft((current) =>
                current
                  ? {
                      ...current,
                      subjects: event.target.value.split(',').map((value) => value.trim()).filter(Boolean),
                    }
                  : current,
              )
            }
          />
        </Field>
        <Field label="Price (ZAR)">
          <input
            type="number"
            value={productDraft.priceZar}
            onChange={(event) =>
              setProductDraft((current) =>
                current
                  ? {
                      ...current,
                      priceZar: Number(event.target.value || 0),
                      priceLabel: `R${Number(event.target.value || 0).toLocaleString('en-ZA')}`,
                    }
                  : current,
              )
            }
          />
        </Field>
        <Field label="Excerpt">
          <textarea value={productDraft.excerpt} onChange={(event) => setProductDraft((current) => current ? { ...current, excerpt: event.target.value } : current)} rows={4} />
        </Field>
        <Field label="Body">
          <textarea value={productDraft.body} onChange={(event) => setProductDraft((current) => current ? { ...current, body: event.target.value } : current)} rows={14} />
        </Field>
      </section>

      <section className="panel">
        <p className="eyebrow">Preview</p>
        <h3>{productDraft.title}</h3>
        <p>
          {productDraft.grade} · {productDraft.term} · {productDraft.primarySubject} · {productDraft.priceLabel}
        </p>
        {toParagraphs(productDraft.body).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span>{label}</span>
      {children}
    </label>
  )
}

export default App
