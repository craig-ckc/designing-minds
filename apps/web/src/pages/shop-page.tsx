import { useDeferredValue, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { publishedProducts, type CmsSnapshot } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Card } from '../components/ui/card'
import { ProductCard } from '../components/ui/product-card'
import { PageHeader } from '../components/ui/headings'
import { ChipGroup, FilterDrawer, FilterTrigger } from '../components/ui/filter-drawer'
import { clearQueryValues, readQueryList, setQueryValue, toggleQueryValue } from '../lib/filter-query'

const SHOP_FILTER_KEYS = ['q', 'grade', 'term', 'subject', 'format', 'kind'] as const

export function ShopPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const subjectNames = snapshot.valueLists.subjects

  const query = searchParams.get('q') ?? ''
  const grades = readQueryList(searchParams, 'grade', snapshot.valueLists.grades)
  const terms = readQueryList(searchParams, 'term', snapshot.valueLists.terms)
  const subjects = readQueryList(searchParams, 'subject', subjectNames)
  const formats = readQueryList(searchParams, 'format', snapshot.valueLists.resourceFormats)
  const kinds = readQueryList(searchParams, 'kind', snapshot.valueLists.productKinds)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const deferredQuery = useDeferredValue(query)
  const q = deferredQuery.trim().toLowerCase()
  const products = publishedProducts(snapshot)

  const visible = products.filter((product) => {
    if (grades.length && !grades.includes(product.grade)) return false
    if (terms.length && !terms.includes(product.term)) return false
    if (subjects.length && !subjects.some((name) => product.subjects.includes(name))) return false
    if (formats.length && !formats.includes(product.resourceFormat)) return false
    if (kinds.length && !kinds.includes(product.productKind)) return false
    if (!q) return true
    return `${product.title} ${product.shortDescription} ${product.subjects.join(' ')}`.toLowerCase().includes(q)
  })

  const activeCount = grades.length + terms.length + subjects.length + formats.length + kinds.length
  const toggle = (key: string) => (value: string) => setSearchParams(toggleQueryValue(searchParams, key, value))
  const reset = () => setSearchParams(clearQueryValues(searchParams, SHOP_FILTER_KEYS))

  return (
    <>
      <PageHeader
        title="All resources"
        lead={`Browse ${snapshot.stats.productCount} CAPS-aligned resources across grades, terms, subjects, formats, and offer types.`}
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
        <ChipGroup label="Type" options={snapshot.valueLists.productKinds} selected={kinds} onToggle={toggle('kind')} />
      </FilterDrawer>

      <section className="section">
        <Container>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2>{visible.length} results</h2>
            <span className="text-muted">Sorted by catalogue order</span>
          </div>
          {visible.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
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
