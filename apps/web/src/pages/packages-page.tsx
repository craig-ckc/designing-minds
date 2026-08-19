import { useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { publishedBundles, type Bundle, type CmsSnapshot } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Card } from '../components/ui/card'
import { BundleCard } from '../components/ui/bundle-card'
import { PageHeader } from '../components/ui/headings'
import { ChipGroup, FilterDrawer, FilterTrigger } from '../components/ui/filter-drawer'
import { clearQueryValues, readQueryList, setQueryValue, toggleQueryValue } from '../lib/filter-query'
import { useDeferredCatalog } from '../lib/deferred-catalog'

// The "Offer" dimension replaces the old tabs, and reads the same as the Shop's
// chips. Access plans are retired, so scope is the only axis left.
const OFFERS = ['Term bundles', 'Full-year bundles']
const PACKAGE_FILTER_KEYS = ['q', 'offer', 'grade', 'term', 'plan'] as const

const matchesOffer = (bundle: Bundle, offer: string) => {
  switch (offer) {
    case 'Term bundles':
      return bundle.bundleScope === 'Term'
    case 'Full-year bundles':
      return bundle.bundleScope === 'Full Year'
    default:
      return true
  }
}

export function PackagesPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const packages = useMemo(() => publishedBundles(snapshot), [snapshot])

  // Legacy deep-links (?plan=essential|premium) came from the retired access
  // tiers. Map them onto the nearest surviving scope rather than 404-ing a link
  // that may still be in the wild.
  const planParam = searchParams.get('plan')
  const legacyOffer = planParam === 'premium' ? 'Full-year bundles' : planParam === 'essential' ? 'Term bundles' : null
  const queryOffers = readQueryList(searchParams, 'offer', OFFERS)
  const offerSel = queryOffers.length ? queryOffers : legacyOffer ? [legacyOffer] : []
  const grades = readQueryList(searchParams, 'grade', snapshot.valueLists.grades)
  const terms = readQueryList(searchParams, 'term', snapshot.valueLists.terms)
  const query = searchParams.get('q') ?? ''
  const [filtersOpen, setFiltersOpen] = useState(false)
  const deferredQuery = useDeferredValue(query)
  const q = deferredQuery.trim().toLowerCase()

  const visible = packages.filter((bundle) => {
    if (offerSel.length && !offerSel.some((offer) => matchesOffer(bundle, offer))) return false
    if (grades.length && !grades.includes(bundle.grade)) return false
    if (terms.length && !terms.includes(bundle.term)) return false
    if (q && !`${bundle.title} ${bundle.shortDescription}`.toLowerCase().includes(q)) return false
    return true
  })
  const renderedPackages = useDeferredCatalog(visible)

  const activeCount = offerSel.length + grades.length + terms.length
  const toggle = (key: string) => (value: string) => {
    const current = new URLSearchParams(searchParams)
    if (key === 'offer' && legacyOffer && !current.has('offer')) current.append('offer', legacyOffer)
    const next = toggleQueryValue(current, key, value)
    if (key === 'offer') next.delete('plan')
    setSearchParams(next)
  }
  const reset = () => setSearchParams(clearQueryValues(searchParams, PACKAGE_FILTER_KEYS))

  return (
    <>
      <PageHeader
        title="Buy more, save more"
        lead="Bundles group the resources for a grade into one discounted, once-off purchase. Nothing renews automatically — you own what you buy."
      >
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Bundles" />
        </div>
      </PageHeader>

      <div className="sticky top-[var(--header-h)] z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <Container className="flex items-center gap-3 py-4">
          <input
            className="field w-full max-w-md"
            value={query}
            onChange={(event) => setSearchParams(setQueryValue(searchParams, 'q', event.target.value), { replace: true })}
            placeholder="Search bundles…"
            aria-label="Search bundles"
          />
          <FilterTrigger onClick={() => setFiltersOpen(true)} activeCount={activeCount} className="ml-auto" />
        </Container>
      </div>

      <FilterDrawer open={filtersOpen} onOpenChange={setFiltersOpen} onReset={reset} resultCount={visible.length}>
        <ChipGroup label="Offer" options={OFFERS} selected={offerSel} onToggle={toggle('offer')} />
        <ChipGroup label="Grade" options={snapshot.valueLists.grades} selected={grades} onToggle={toggle('grade')} />
        <ChipGroup label="Term" options={snapshot.valueLists.terms} selected={terms} onToggle={toggle('term')} />
      </FilterDrawer>

      <section className="section">
        <Container>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2>{visible.length} results</h2>
            <span className="text-muted">Sorted by catalogue order</span>
          </div>
          {visible.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {renderedPackages.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} snapshot={snapshot} className="col-span-2" />
              ))}
            </div>
          ) : (
            <Card variant="surface" pad="none" className="p-7 text-center">
              <h2>No matching bundles</h2>
              <p className="mt-2 text-muted">Try clearing a filter or choosing a different grade.</p>
            </Card>
          )}
        </Container>
      </section>
    </>
  )
}
