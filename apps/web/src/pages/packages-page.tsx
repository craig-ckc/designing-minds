import { useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ALL, type CmsSnapshot, type Product, publishedProducts } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Field } from '../components/ui/field'
import { Select } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { ProductCard } from '../components/ui/product-card'
import { PageHeader } from '../components/ui/headings'
import offers from '../content/packages/package-offers.json'

// The single "Offer" dimension that replaces the old tabs/segmented toggle, so
// Packages filters read the same way as the Shop's "Type" Select.
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
  const [searchParams, setSearchParams] = useSearchParams()
  const packages = useMemo(
    () => publishedProducts(snapshot).filter((p) => p.productKind === 'Bundle' || p.productKind === 'Access Plan'),
    [snapshot],
  )

  // Deep-links from the homepage/nav tiers (?plan=essential|premium) pre-select the Offer.
  const planParam = searchParams.get('plan')
  const initialOffer = planParam === 'premium' ? 'Premium access' : planParam === 'essential' ? 'Essential access' : ALL

  const [offer, setOffer] = useState<string>(initialOffer)
  const [grade, setGrade] = useState<string>(searchParams.get('grade') ?? ALL)
  const [term, setTerm] = useState<string>(ALL)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  const visible = packages.filter((product) => {
    if (!matchesOffer(product, offer)) return false
    if (grade !== ALL && product.grade !== grade) return false
    if (term !== ALL && product.term !== term) return false
    const q = deferredQuery.trim().toLowerCase()
    if (q && !`${product.title} ${product.shortDescription}`.toLowerCase().includes(q)) return false
    return true
  })

  // Mirror the Shop: persist only the entry-relevant params (grade + plan tier).
  const sync = (nextOffer: string, nextGrade: string) => {
    const params = new URLSearchParams()
    if (nextGrade !== ALL) params.set('grade', nextGrade)
    if (nextOffer === 'Essential access') params.set('plan', 'essential')
    else if (nextOffer === 'Premium access') params.set('plan', 'premium')
    setSearchParams(params, { replace: true })
  }

  const reset = () => {
    setOffer(ALL)
    setGrade(ALL)
    setTerm(ALL)
    setQuery('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  return (
    <>
      <PageHeader
        eyebrow="Bundles & access plans"
        title="Buy more, save more"
        lead="Bundles group a grade’s resources into one discounted, once-off purchase. Access plans unlock a single grade for a term or the full year — none of these renew automatically."
      >
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Packages" />
        </div>
      </PageHeader>

      <div className="sticky top-[72px] z-20 border-b border-line bg-white/95 backdrop-blur">
        <Container className="flex flex-wrap items-end gap-3 py-4">
          <div className="min-w-[200px] flex-1">
            <Field label="Search">
              <input
                className="field"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. Grade 5 premium"
              />
            </Field>
          </div>
          <div className="min-w-[180px]">
            <Select
              label="Offer"
              value={offer}
              options={[ALL, ...OFFERS]}
              onChange={(v) => {
                setOffer(v)
                sync(v, grade)
              }}
            />
          </div>
          <div className="min-w-[150px]">
            <Select
              label="Grade"
              value={grade}
              options={[ALL, ...snapshot.valueLists.grades]}
              onChange={(v) => {
                setGrade(v)
                sync(offer, v)
              }}
            />
          </div>
          <div className="min-w-[140px]">
            <Select label="Term" value={term} options={[ALL, ...snapshot.valueLists.terms]} onChange={setTerm} />
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="card p-7 text-center">
              <h4>No matching packages</h4>
              <p className="mt-2 text-muted">Try clearing a filter or choosing a different grade.</p>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
