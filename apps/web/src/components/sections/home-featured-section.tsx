import { useState } from 'react'
import { publishedBundles, publishedProducts, type CmsSnapshot } from '@designing-minds/cms'
import { featuredCatalog, type FeaturedCategory } from '../../lib/featured-catalog'
import { BundleCard } from '../ui/bundle-card'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { ProductCard } from '../ui/product-card'
import { Section, SectionNotice } from '../ui/section'

export function HomeFeaturedSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  const [selected, setSelected] = useState<FeaturedCategory>('all')
  const hasResources = Boolean(snapshot && publishedProducts(snapshot).length)
  const hasBundles = Boolean(snapshot && publishedBundles(snapshot).length)
  const category = hasResources && hasBundles ? selected : 'all'
  const entries = snapshot ? featuredCatalog(snapshot, category) : []

  return (
    <Section id="featured-products">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2>Featured products</h2>
          <p className="mt-3 text-body-lg text-ink-soft">Start with these tests, summaries and bundles for Grades 3–7.</p>
        </div>
        <Button to="/shop" variant="text" className="px-0">Browse the shop <Icon name="arrow" size={16} /></Button>
      </div>
      {hasResources && hasBundles ? (
        <div role="group" aria-label="Featured product categories" className="mb-6 flex flex-wrap gap-2">
          {([{ value: 'all', label: 'All products' }, { value: 'resources', label: 'Resources' }, { value: 'bundles', label: 'Bundles' }] as const).map(({ value, label }) => (
            <button key={value} type="button" className="filter-chip" aria-pressed={category === value} aria-controls="featured-catalog" onClick={() => setSelected(value)}>
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {!snapshot ? (
        <SectionNotice title={loadError ? 'Products are unavailable' : 'Loading products…'} body={loadError ?? 'The latest products will appear when the catalogue is ready.'} />
      ) : entries.length === 0 ? (
        <SectionNotice title="No products are available right now" body="Please check back later, or contact us for help finding learning materials." />
      ) : (
        <div id="featured-catalog" className="catalog-grid featured-rail">
          {entries.map((entry) => entry.kind === 'bundle'
            ? <BundleCard key={`bundle-${entry.bundle.id}`} bundle={entry.bundle} snapshot={snapshot} />
            : <ProductCard key={`product-${entry.product.id}`} product={entry.product} />)}
        </div>
      )}
    </Section>
  )
}
