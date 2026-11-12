import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { publishedBundles, publishedProducts, type Bundle, type PhysicalCatalogProduct, type Product } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { ActiveFilterChips, type ActiveFilter } from '../components/ui/active-filter-chips'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Card } from '../components/ui/card'
import { BundleCard } from '../components/ui/bundle-card'
import { ProductCard } from '../components/ui/product-card'
import { PageHeader } from '../components/ui/headings'
import { LoadMoreButton } from '../components/ui/load-more-button'
import { ChipGroup, FilterDrawer, FilterTrigger, ProductTypeGroup, type ProductTypeValue } from '../components/ui/filter-drawer'
import { useCatalogSnapshot } from '../lib/catalog'
import { clearQueryValues, normalizeGradeParams, readGradeList, readQueryList, setQueryValue, shopSubtitle, toggleQueryValue } from '../lib/filter-query'
import { CATALOG_INITIAL_LIMIT, useCatalogLoadMore } from '../lib/deferred-catalog'
import { CatalogSortControl } from '../components/ui/catalog-sort-control'
import { readCatalogSort, sortCatalogItems } from '../lib/catalog-sort'

const SHOP_FILTER_KEYS = ['q', 'grade', 'term', 'subject', 'format', 'type'] as const

/**
 * One grid, bundles first.
 *
 * Bundles and resources are separate Collections now, but the shop is a single
 * ordered list rather than two sections: a shopper scrolls one grid, and the
 * cheaper-per-item way to buy leads it. Only the card component differs.
 */
type Entry = { kind: 'bundle'; bundle: Bundle } | { kind: 'product'; product: Product } | { kind: 'physical'; product: PhysicalCatalogProduct }

export function ShopPage() {
  const snapshot = useCatalogSnapshot()
  const [searchParams, setSearchParams] = useSearchParams()
  const subjectNames = snapshot.valueLists.subjects

  const query = searchParams.get('q') ?? ''
  const grades = readGradeList(searchParams, snapshot.valueLists.grades)
  const terms = readQueryList(searchParams, 'term', snapshot.valueLists.terms)
  const subjects = readQueryList(searchParams, 'subject', subjectNames)
  const formats = readQueryList(searchParams, 'format', snapshot.valueLists.resourceFormats)
  const hasPhysicalCatalog = (snapshot.physicalCatalog ?? []).length > 0
  // The type group only exists alongside a physical catalogue, so `?type=` is ignored without one.
  const typeParam = searchParams.get('type')
  const category: ProductTypeValue = hasPhysicalCatalog && (typeParam === 'digital' || typeParam === 'physical') ? typeParam : 'all'
  const [filtersOpen, setFiltersOpen] = useState(false)
  const sort = readCatalogSort(searchParams.get('sort'))

  const deferredQuery = useDeferredValue(query)
  const q = deferredQuery.trim().toLowerCase()

  const visible = useMemo<Entry[]>(() => {
    const digitalSelected = category !== 'physical'
    const physicalSelected = category !== 'digital'
    const matchingProducts = digitalSelected ? publishedProducts(snapshot).filter((product) => {
      if (grades.length && !grades.includes(product.grade)) return false
      if (terms.length && !terms.includes(product.term)) return false
      if (subjects.length && !subjects.some((name) => product.subjects.includes(name))) return false
      if (formats.length && !formats.includes(product.resourceFormat)) return false
      if (!q) return true
      return `${product.title} ${product.shortDescription} ${product.subjects.join(' ')}`.toLowerCase().includes(q)
    }) : []

    // Physical goods have no education taxonomy. When a shopper narrows by
    // grade, term, subject or format, omit them instead of implying a match.
    const matchingPhysical = physicalSelected && !grades.length && !terms.length && !subjects.length && !formats.length
      ? (snapshot.physicalCatalog ?? []).filter((product) =>
          !q || `${product.title} ${product.shortDescription} ${product.fullDescription}`.toLowerCase().includes(q),
        )
      : []

    // A bundle carries no subjects or format of its own, so those facets match
    // against what it contains — filtering to "Mathematics" should surface the
    // maths bundle, not hide it. Membership is resolved once, here.
    const bySlug = new Map(publishedProducts(snapshot).map((product) => [product.slug, product]))
    const matchingBundles = digitalSelected ? publishedBundles(snapshot).filter((bundle) => {
      if (grades.length && !grades.includes(bundle.grade)) return false
      const members = bundle.includedProductSlugs
        .map((slug) => bySlug.get(slug))
        .filter((product): product is Product => Boolean(product))
      if (terms.length && !terms.includes(bundle.term) && !members.some((m) => terms.includes(m.term))) return false
      if (subjects.length && !members.some((m) => subjects.some((name) => m.subjects.includes(name)))) return false
      if (formats.length && !members.some((m) => formats.includes(m.resourceFormat))) return false
      if (!q) return true
      return `${bundle.title} ${bundle.shortDescription}`.toLowerCase().includes(q)
    }) : []

    return sortCatalogItems([
      ...matchingBundles.map((bundle): Entry => ({ kind: 'bundle', bundle })),
      ...matchingProducts.map((product): Entry => ({ kind: 'product', product })),
      ...matchingPhysical.map((product): Entry => ({ kind: 'physical', product })),
    ], sort, (entry) => entry.kind === 'bundle' ? entry.bundle : entry.product)
  }, [snapshot, grades, terms, subjects, formats, category, q, sort])

  const catalogResetKey = JSON.stringify([grades, terms, subjects, formats, category, q, sort])
  const { visible: rendered, loadMore } = useCatalogLoadMore(visible, CATALOG_INITIAL_LIMIT, catalogResetKey)

  const activeCount = grades.length + terms.length + subjects.length + formats.length + (category === 'all' ? 0 : 1)
  const toggle = (key: string) => (value: string) =>
    setSearchParams(toggleQueryValue(key === 'grade' ? normalizeGradeParams(searchParams, snapshot.valueLists.grades) : searchParams, key, value))
  const chooseType = (value: ProductTypeValue) => {
    // Gifts have no grade, term, subject or format, so choosing them drops those filters.
    const next = clearQueryValues(searchParams, value === 'physical' ? ['type', 'grade', 'term', 'subject', 'format'] : ['type'])
    if (value !== 'all') next.set('type', value)
    setSearchParams(next)
  }
  const searchRef = useRef<HTMLInputElement>(null)
  const activeFilters: ActiveFilter[] = [
    ...(category === 'all' ? [] : [{ key: 'type', value: category, label: category === 'digital' ? 'Digital resources' : 'Gifts & keyrings' }]),
    ...grades.map((value) => ({ key: 'grade', value, label: value })),
    ...terms.map((value) => ({ key: 'term', value, label: value })),
    ...subjects.map((value) => ({ key: 'subject', value, label: value })),
    ...formats.map((value) => ({ key: 'format', value, label: value })),
  ]
  const removeFilter = ({ key, value }: ActiveFilter) =>
    key === 'type' ? setSearchParams(clearQueryValues(searchParams, ['type'])) : toggle(key)(value)
  const reset = () => setSearchParams(clearQueryValues(searchParams, SHOP_FILTER_KEYS))

  const bundleCount = visible.filter((entry) => entry.kind === 'bundle').length
  const physicalCount = visible.filter((entry) => entry.kind === 'physical').length

  return (
    <>
      <PageHeader width="full" title={hasPhysicalCatalog ? 'All products' : 'All resources'} lead={shopSubtitle(grades)}>
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Shop" />
        </div>
      </PageHeader>

      <div className="sticky top-[var(--header-h)] z-20 border-b border-line bg-canvas/90 backdrop-blur-md">
        <Container width="full" className="flex flex-wrap items-center gap-2 py-3">
          <input
            ref={searchRef}
            className="field min-w-0 basis-full sm:basis-auto sm:w-64"
            value={query}
            onChange={(event) => setSearchParams(setQueryValue(searchParams, 'q', event.target.value), { replace: true })}
            placeholder={hasPhysicalCatalog ? 'Search products…' : 'Search resources…'}
            aria-label={hasPhysicalCatalog ? 'Search products' : 'Search resources'}
          />
          <ActiveFilterChips filters={activeFilters} onRemove={removeFilter} emptyFocusRef={searchRef} />
          <div className="ml-auto flex items-center gap-2">
            <FilterTrigger onClick={() => setFiltersOpen(true)} activeCount={activeCount} />
            <CatalogSortControl value={sort} onChange={(value) => setSearchParams(setQueryValue(searchParams, 'sort', value))} />
          </div>
        </Container>
      </div>

      <FilterDrawer open={filtersOpen} onOpenChange={setFiltersOpen} onReset={reset} resultCount={visible.length}>
        {hasPhysicalCatalog ? <ProductTypeGroup value={category} onChange={chooseType} /> : null}
        <ChipGroup label="Grade" options={snapshot.valueLists.grades} selected={grades} onToggle={toggle('grade')} disabled={category === 'physical'} />
        <ChipGroup label="Term" options={snapshot.valueLists.terms} selected={terms} onToggle={toggle('term')} disabled={category === 'physical'} />
        <ChipGroup label="Subject" options={subjectNames} selected={subjects} onToggle={toggle('subject')} disabled={category === 'physical'} />
        <ChipGroup label="Format" options={snapshot.valueLists.resourceFormats} selected={formats} onToggle={toggle('format')} disabled={category === 'physical'} />
      </FilterDrawer>

      <section className="section-tight">
        <Container width="full">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-body-lg font-semibold tracking-normal">{visible.length} results</h2>
            {bundleCount > 0 && sort === 'recommended' ? <span className="text-muted">Bundles first</span> : null}
          </div>
          {visible.length > 0 ? (
            <div className="catalog-grid">
              {rendered.map((entry) =>
                entry.kind === 'bundle' ? (
                  <BundleCard key={entry.bundle.id} bundle={entry.bundle} snapshot={snapshot} />
                ) : entry.kind === 'product' ? (
                  <ProductCard key={entry.product.id} product={entry.product} />
                ) : (
                  <ProductCard key={entry.product.id} product={entry.product} />
                ),
              )}
            </div>
          ) : (
            <Card variant="surface" pad="none" className="p-8 text-center">
              <h2>No matching {hasPhysicalCatalog ? 'products' : 'resources'}</h2>
              <p className="mt-2 text-muted">Try clearing a filter or searching for a different grade, subject or product.</p>
            </Card>
          )}
          <LoadMoreButton remaining={visible.length - rendered.length} itemLabel={physicalCount ? 'items' : 'resources'} onLoadMore={loadMore} />
        </Container>
      </section>
    </>
  )
}
