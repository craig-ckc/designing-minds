import type { PhysicalCatalogProduct } from '@designing-minds/cms'
import { Button } from './ui/button'
import { Container } from './ui/container'
import { ArrowAffordance } from './ui/icon'
import { ProductCard } from './ui/product-card'

export function RelatedPhysicalProducts({ product, catalog }: {
  product: PhysicalCatalogProduct
  catalog: PhysicalCatalogProduct[]
}) {
  const ids = new Set([product.id])
  const slugs = new Set([product.slug])
  const related = catalog.filter((entry) => {
    if (!entry.published || ids.has(entry.id) || slugs.has(entry.slug)) return false
    ids.add(entry.id)
    slugs.add(entry.slug)
    return true
  }).slice(0, 4)

  if (related.length === 0) return null

  return (
    <section className="product-detail py-8 sm:py-10 lg:py-12" aria-labelledby="related-products-heading">
      <Container width="full">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 id="related-products-heading" className="text-xl font-bold leading-snug tracking-normal">Related products</h2>
          <Button to="/shop?type=physical" variant="text">
            See all gifts &amp; keyrings
            <ArrowAffordance size="md" />
          </Button>
        </div>
        <div className="catalog-grid">
          {related.map((entry) => <ProductCard key={entry.id} product={entry} />)}
        </div>
      </Container>
    </section>
  )
}
