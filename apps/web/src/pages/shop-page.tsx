import { useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { publishedProducts, type CmsSnapshot } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Card } from '../components/ui/card'
import { ProductCard } from '../components/ui/product-card'
import { PageHeader } from '../components/ui/headings'
import { ChipGroup, FilterDrawer, FilterTrigger, makeToggle } from '../components/ui/filter-drawer'

export function ShopPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [searchParams] = useSearchParams()
  const subjectNames = useMemo(() => snapshot.subjects.map((s) => s.name), [snapshot])
  const nameToSlug = useMemo(() => new Map(snapshot.subjects.map((s) => [s.name, s.slug])), [snapshot])

  const initialGrade = searchParams.get('grade')
  const initialKind = searchParams.get('kind')

  const [query, setQuery] = useState('')
  const [grades, setGrades] = useState<string[]>(initialGrade ? [initialGrade] : [])
  const [terms, setTerms] = useState<string[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [formats, setFormats] = useState<string[]>([])
  const [kinds, setKinds] = useState<string[]>(initialKind ? [initialKind] : [])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const deferredQuery = useDeferredValue(query)
  const q = deferredQuery.trim().toLowerCase()
  const products = publishedProducts(snapshot)

  const visible = products.filter((product) => {
    if (grades.length && !grades.includes(product.grade)) return false
    if (terms.length && !terms.includes(product.term)) return false
    if (subjects.length && !subjects.some((name) => product.subjects.includes(nameToSlug.get(name) ?? name))) return false
    if (formats.length && !formats.includes(product.resourceFormat)) return false
    if (kinds.length && !kinds.includes(product.productKind)) return false
    if (!q) return true
    return `${product.title} ${product.shortDescription} ${product.subjects.join(' ')}`.toLowerCase().includes(q)
  })

  const activeCount = grades.length + terms.length + subjects.length + formats.length + kinds.length
  const reset = () => {
    setGrades([])
    setTerms([])
    setSubjects([])
    setFormats([])
    setKinds([])
    setQuery('')
  }

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
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resources…"
            aria-label="Search resources"
          />
          <FilterTrigger onClick={() => setFiltersOpen(true)} activeCount={activeCount} className="ml-auto" />
        </Container>
      </div>

      <FilterDrawer open={filtersOpen} onOpenChange={setFiltersOpen} onReset={reset} resultCount={visible.length}>
        <ChipGroup label="Grade" options={snapshot.valueLists.grades} selected={grades} onToggle={makeToggle(setGrades)} />
        <ChipGroup label="Term" options={snapshot.valueLists.terms} selected={terms} onToggle={makeToggle(setTerms)} />
        <ChipGroup label="Subject" options={subjectNames} selected={subjects} onToggle={makeToggle(setSubjects)} />
        <ChipGroup label="Format" options={snapshot.valueLists.resourceFormats} selected={formats} onToggle={makeToggle(setFormats)} />
        <ChipGroup label="Type" options={snapshot.valueLists.productKinds} selected={kinds} onToggle={makeToggle(setKinds)} />
      </FilterDrawer>

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
            <Card variant="surface" pad="none" className="p-7 text-center">
              <h4>No matching resources</h4>
              <p className="mt-2 text-muted">Try clearing a filter or searching for a different grade or subject.</p>
            </Card>
          )}
        </Container>
      </section>
    </>
  )
}
