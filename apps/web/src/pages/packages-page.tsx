import { useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { type CmsSnapshot, type Product, publishedProducts } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Card } from '../components/ui/card'
import { ProductCard } from '../components/ui/product-card'
import { PageHeader } from '../components/ui/headings'
import { ChipGroup, FilterDrawer, FilterTrigger, makeToggle } from '../components/ui/filter-drawer'
import offers from '../content/packages/package-offers.json'

// The "Offer" dimension replaces the old tabs, and reads the same as the Shop's chips.
const OFFERS = offers as string[]

const matchesOffer = (product: Product, offer: string) => {
  switch (offer) {
    case 'Term bundles':
      return product.productKind === 'Bundle' && product.bundleScope === 'Term'
    case 'Full-year bundles':
      return product.productKind === 'Bundle' && product.bundleScope === 'Full Year'
    case 'Essential access':
      return product.productKind === 'Access Plan' && product.accessPeriod === 'Term'
    case 'Premium access':
      return product.productKind === 'Access Plan' && product.accessPeriod === 'Year'
    default:
      return true
  }
}

export function PackagesPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [searchParams] = useSearchParams()
  const packages = useMemo(
    () => publishedProducts(snapshot).filter((p) => p.productKind === 'Bundle' || p.productKind === 'Access Plan'),
    [snapshot],
  )

  // Deep-links from the homepage/nav tiers (?plan=essential|premium) pre-select the Offer.
  const planParam = searchParams.get('plan')
  const initialOffer = planParam === 'premium' ? 'Premium access' : planParam === 'essential' ? 'Essential access' : null
  const initialGrade = searchParams.get('grade')

  const [offerSel, setOfferSel] = useState<string[]>(initialOffer ? [initialOffer] : [])
  const [grades, setGrades] = useState<string[]>(initialGrade ? [initialGrade] : [])
  const [terms, setTerms] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const deferredQuery = useDeferredValue(query)
  const q = deferredQuery.trim().toLowerCase()

  const visible = packages.filter((product) => {
    if (offerSel.length && !offerSel.some((offer) => matchesOffer(product, offer))) return false
    if (grades.length && !grades.includes(product.grade)) return false
    if (terms.length && !terms.includes(product.term)) return false
    if (q && !`${product.title} ${product.shortDescription}`.toLowerCase().includes(q)) return false
    return true
  })

  const activeCount = offerSel.length + grades.length + terms.length
  const reset = () => {
    setOfferSel([])
    setGrades([])
    setTerms([])
    setQuery('')
  }

  return (
    <>
      <PageHeader
        title="Buy more, save more"
        lead="Bundles group a grade’s resources into one discounted, once-off purchase. Access plans unlock a single grade for a term or the full year — none of these renew automatically."
      >
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Packages" />
        </div>
      </PageHeader>

      <div className="sticky top-[var(--header-h)] z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <Container className="flex items-center gap-3 py-4">
          <input
            className="field w-full max-w-md"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search packages…"
            aria-label="Search packages"
          />
          <FilterTrigger onClick={() => setFiltersOpen(true)} activeCount={activeCount} className="ml-auto" />
        </Container>
      </div>

      <FilterDrawer open={filtersOpen} onOpenChange={setFiltersOpen} onReset={reset} resultCount={visible.length}>
        <ChipGroup label="Offer" options={OFFERS} selected={offerSel} onToggle={makeToggle(setOfferSel)} />
        <ChipGroup label="Grade" options={snapshot.valueLists.grades} selected={grades} onToggle={makeToggle(setGrades)} />
        <ChipGroup label="Term" options={snapshot.valueLists.terms} selected={terms} onToggle={makeToggle(setTerms)} />
      </FilterDrawer>

      <section className="section">
        <Container>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h4>{visible.length} results</h4>
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
              <h4>No matching packages</h4>
              <p className="mt-2 text-muted">Try clearing a filter or choosing a different grade.</p>
            </Card>
          )}
        </Container>
      </section>
    </>
  )
}
