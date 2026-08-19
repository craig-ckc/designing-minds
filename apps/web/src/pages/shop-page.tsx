import { useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { publishedBundles, publishedProducts, type Bundle, type CmsSnapshot, type Product } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Card } from '../components/ui/card'
import { BundleCard } from '../components/ui/bundle-card'
import { ProductCard } from '../components/ui/product-card'
import { PageHeader } from '../components/ui/headings'
import { ChipGroup, FilterDrawer, FilterTrigger } from '../components/ui/filter-drawer'
import { clearQueryValues, readQueryList, setQueryValue, toggleQueryValue } from '../lib/filter-query'
import { useDeferredCatalog } from '../lib/deferred-catalog'

const SHOP_FILTER_KEYS = ['q', 'grade', 'term', 'subject', 'format'] as const

/**
 * One grid, bundles first.
 *
 * Bundles and resources are separate Collections now, but the shop is a single
 * ordered list rather than two sections: a shopper scrolls one grid, and the
 * cheaper-per-item way to buy leads it. Only the card component differs.
 */
type Entry = { kind: 'bundle'; bundle: Bundle } | { kind: 'product'; product: Product }

export function ShopPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const subjectNames = snapshot.valueLists.subjects

  const query = searchParams.get('q') ?? ''
  const grades = readQueryList(searchParams, 'grade', snapshot.valueLists.grades)
  const terms = readQueryList(searchParams, 'term', snapshot.valueLists.terms)
  const subjects = readQueryList(searchParams, 'subject', subjectNames)
  const formats = readQueryList(searchParams, 'format', snapshot.valueLists.resourceFormats)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const deferredQuery = useDeferredValue(query)
  const q = deferredQuery.trim().toLowerCase()

  const visible = useMemo<Entry[]>(() => {
    const matchingProducts = publishedProducts(snapshot).filter((product) => {
      if (grades.length && !grades.includes(product.grade)) return false
      if (terms.length && !terms.includes(product.term)) return false
      if (subjects.length && !subjects.some((name) => product.subjects.includes(name))) return false
      if (formats.length && !formats.includes(product.resourceFormat)) return false
      if (!q) return true
      return `${product.title} ${product.shortDescription} ${product.subjects.join(' ')}`.toLowerCase().includes(q)
    })

    // A bundle carries no subjects or format of its own, so those facets match
    // against what it contains — filtering to "Mathematics" should surface the
    // maths bundle, not hide it. Membership is resolved once, here.
    const bySlug = new Map(publishedProducts(snapshot).map((product) => [product.slug, product]))
    const matchingBundles = publishedBundles(snapshot).filter((bundle) => {
      if (grades.length && !grades.includes(bundle.grade)) return false
      const members = bundle.includedProductSlugs
        .map((slug) => bySlug.get(slug))
        .filter((product): product is Product => Boolean(product))
      if (terms.length && !terms.includes(bundle.term) && !members.some((m) => terms.includes(m.term))) return false
      if (subjects.length && !members.some((m) => subjects.some((name) => m.subjects.includes(name)))) return false
      if (formats.length && !members.some((m) => formats.includes(m.resourceFormat))) return false
      if (!q) return true
      return `${bundle.title} ${bundle.shortDescription}`.toLowerCase().includes(q)
    })

    return [
      ...matchingBundles.map((bundle): Entry => ({ kind: 'bundle', bundle })),
      ...matchingProducts.map((product): Entry => ({ kind: 'product', product })),
    ]
  }, [snapshot, grades, terms, subjects, formats, q])

  // Static HTML stays bounded; the rest of the grid arrives once React hydrates.
  const rendered = useDeferredCatalog(visible)

  const activeCount = grades.length + terms.length + subjects.length + formats.length
  const toggle = (key: string) => (value: string) => setSearchParams(toggleQueryValue(searchParams, key, value))
  const reset = () => setSearchParams(clearQueryValues(searchParams, SHOP_FILTER_KEYS))

  const bundleCount = visible.filter((entry) => entry.kind === 'bundle').length

  return (
    <>
      <PageHeader
        title="All resources"
        lead={`Browse ${snapshot.stats.productCount} CAPS-aligned resources across grades, terms, subjects and formats — or start with a bundle.`}
      >
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Shop" />
        </div>
      </PageHeader>

      <div className="sticky top-[var(--header-h)] z-20 border-b border-line bg-canvas/90 backdrop-blur-md">
        <Container className="flex items-center gap-3 py-4">
          <input
            className="field w-full max-w-md"
            value={query}
            onChange={(event) => setSearchParams(setQueryValue(searchParams, 'q', event.target.value), { replace: true })}
            placeholder="Search resources…"
            aria-label="Search resources"
          />
          <FilterTrigger onClick={() => setFiltersOpen(true)} activeCount={activeCount} className="ml-auto" />
        </Container>
      </div>

      <FilterDrawer open={filtersOpen} onOpenChange={setFiltersOpen} onReset={reset} resultCount={visible.length}>
        <ChipGroup label="Grade" options={snapshot.valueLists.grades} selected={grades} onToggle={toggle('grade')} />
        <ChipGroup label="Term" options={snapshot.valueLists.terms} selected={terms} onToggle={toggle('term')} />
        <ChipGroup label="Subject" options={subjectNames} selected={subjects} onToggle={toggle('subject')} />
        <ChipGroup label="Format" options={snapshot.valueLists.resourceFormats} selected={formats} onToggle={toggle('format')} />
      </FilterDrawer>

      <section className="section">
        <Container>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2>{visible.length} results</h2>
            {bundleCount > 0 ? <span className="text-muted">Bundles first</span> : null}
          </div>
          {visible.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {rendered.map((entry) =>
                entry.kind === 'bundle' ? (
                  <BundleCard key={entry.bundle.id} bundle={entry.bundle} snapshot={snapshot} className="col-span-2" />
                ) : (
                  <ProductCard key={entry.product.id} product={entry.product} />
                ),
              )}
            </div>
          ) : (
            <Card variant="surface" pad="none" className="p-7 text-center">
              <h2>No matching resources</h2>
              <p className="mt-2 text-muted">Try clearing a filter or searching for a different grade or subject.</p>
            </Card>
          )}
        </Container>
      </section>
    </>
  )
}
