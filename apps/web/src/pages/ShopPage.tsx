import { useState } from 'react'
import { useDeferredValue } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  defaultProductFilters,
  filterProducts,
  type CmsSnapshot,
  type ProductFilterState,
} from '@designing-minds/cms'
import { Container } from '../components/ui/Container'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { Field, SelectField } from '../components/ui/Field'
import { ProductCard } from '../components/ProductCard'

export function ShopPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState<ProductFilterState>(() => ({
    ...defaultProductFilters,
    grade: searchParams.get('grade') ?? defaultProductFilters.grade,
    subject: searchParams.get('subject') ?? defaultProductFilters.subject,
  }))

  const deferredQuery = useDeferredValue(filters.query)
  const visibleProducts = filterProducts(snapshot.products, { ...filters, query: deferredQuery })

  const updateFilter = (patch: Partial<ProductFilterState>) => {
    setFilters((current) => {
      const next = { ...current, ...patch }
      const params = new URLSearchParams()
      if (next.grade !== defaultProductFilters.grade) params.set('grade', next.grade)
      if (next.subject !== defaultProductFilters.subject) params.set('subject', next.subject)
      setSearchParams(params, { replace: true })
      return next
    })
  }

  const resetFilters = () => {
    setFilters(defaultProductFilters)
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  return (
    <>
      <section className="section-tight bg-surface-alt">
        <Container>
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Shop" />
          <div className="max-w-[640px]">
            <Eyebrow>Catalogue</Eyebrow>
            <h1>All tests &amp; bundles</h1>
            <p className="mt-4 lead">
              Browse {snapshot.stats.productCount} CAPS-aligned resources across grades, terms, subjects, and formats.
            </p>
          </div>
        </Container>
      </section>

      <div className="sticky top-[72px] z-20 border-b border-line bg-white/95 backdrop-blur">
        <Container className="flex flex-wrap items-end gap-3 py-4">
          <div className="min-w-[200px] flex-1">
            <Field label="Search">
              <input
                className="field"
                value={filters.query}
                onChange={(event) => updateFilter({ query: event.target.value })}
                placeholder="e.g. Grade 5 maths"
              />
            </Field>
          </div>
          <div className="min-w-[150px]">
            <SelectField
              label="Grade"
              value={filters.grade}
              options={['All grades', ...snapshot.filters.grades]}
              onChange={(value) => updateFilter({ grade: value })}
            />
          </div>
          <div className="min-w-[140px]">
            <SelectField
              label="Term"
              value={filters.term}
              options={['All terms', ...snapshot.filters.terms]}
              onChange={(value) => updateFilter({ term: value })}
            />
          </div>
          <div className="min-w-[170px]">
            <SelectField
              label="Subject"
              value={filters.subject}
              options={['All subjects', ...snapshot.filters.subjects]}
              onChange={(value) => updateFilter({ subject: value })}
            />
          </div>
          <div className="min-w-[150px]">
            <SelectField
              label="Format"
              value={filters.type}
              options={['All formats', ...snapshot.filters.productTypes]}
              onChange={(value) => updateFilter({ type: value })}
            />
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto min-h-[46px] text-[0.9rem] font-medium text-ink underline underline-offset-4 hover:opacity-70"
          >
            Reset filters
          </button>
        </Container>
      </div>

      <section className="section">
        <Container>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h4>{visibleProducts.length} results</h4>
            <span className="text-muted">Sorted by most recent</span>
          </div>
          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="card p-7 text-center">
              <h4>No matching resources</h4>
              <p className="mt-2 text-muted">Try clearing a filter or searching for a different grade or subject.</p>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
