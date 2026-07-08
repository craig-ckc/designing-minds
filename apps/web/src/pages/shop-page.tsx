import { useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ALL,
  defaultProductFilters,
  filterProducts,
  publishedProducts,
  type CmsSnapshot,
  type ProductFilterState,
} from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Field } from '../components/ui/field'
import { Select } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { ProductCard } from '../components/ui/product-card'
import { PageHeader } from '../components/ui/headings'

export function ShopPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const subjectNames = useMemo(() => snapshot.subjects.map((s) => s.name), [snapshot])
  const nameToSlug = useMemo(() => new Map(snapshot.subjects.map((s) => [s.name, s.slug])), [snapshot])

  const [filters, setFilters] = useState<ProductFilterState>(() => ({
    ...defaultProductFilters,
    grade: searchParams.get('grade') ?? defaultProductFilters.grade,
    kind: searchParams.get('kind') ?? defaultProductFilters.kind,
  }))

  const deferredQuery = useDeferredValue(filters.query)
  const products = publishedProducts(snapshot)
  const visible = filterProducts(products, {
    ...filters,
    query: deferredQuery,
    subject: filters.subject === ALL ? ALL : nameToSlug.get(filters.subject) ?? ALL,
  })

  const update = (patch: Partial<ProductFilterState>) => {
    setFilters((current) => {
      const next = { ...current, ...patch }
      const params = new URLSearchParams()
      if (next.grade !== ALL) params.set('grade', next.grade)
      if (next.kind !== ALL) params.set('kind', next.kind)
      setSearchParams(params, { replace: true })
      return next
    })
  }

  const reset = () => {
    setFilters(defaultProductFilters)
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="All resources"
        lead={`Browse ${snapshot.stats.productCount} CAPS-aligned resources across grades, terms, subjects, formats, and offer types.`}
      >
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Shop" />
        </div>
      </PageHeader>

      <div className="sticky top-[72px] z-20 border-b border-line bg-canvas/90 backdrop-blur-md">
        <Container className="flex flex-wrap items-end gap-3 py-4">
          <div className="min-w-[200px] flex-1">
            <Field label="Search">
              <input
                className="field"
                value={filters.query}
                onChange={(event) => update({ query: event.target.value })}
                placeholder="e.g. Grade 5 maths"
              />
            </Field>
          </div>
          <div className="min-w-[150px]">
            <Select label="Grade" value={filters.grade} options={[ALL, ...snapshot.valueLists.grades]} onChange={(v) => update({ grade: v })} />
          </div>
          <div className="min-w-[140px]">
            <Select label="Term" value={filters.term} options={[ALL, ...snapshot.valueLists.terms]} onChange={(v) => update({ term: v })} />
          </div>
          <div className="min-w-[170px]">
            <Select label="Subject" value={filters.subject} options={[ALL, ...subjectNames]} onChange={(v) => update({ subject: v })} />
          </div>
          <div className="min-w-[150px]">
            <Select label="Format" value={filters.resourceFormat} options={[ALL, ...snapshot.valueLists.resourceFormats]} onChange={(v) => update({ resourceFormat: v })} />
          </div>
          <div className="min-w-[160px]">
            <Select label="Type" value={filters.kind} options={[ALL, ...snapshot.valueLists.productKinds]} onChange={(v) => update({ kind: v })} />
          </div>
          <Button type="button" variant="soft" onClick={reset} className="ml-auto">
            Reset filters
          </Button>
        </Container>
      </div>

      <section className="section">
        <Container>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h4>{visible.length} results</h4>
            <span className="text-muted">Sorted by catalogue order</span>
          </div>
          {visible.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => (
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
