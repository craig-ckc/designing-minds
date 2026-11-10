import { Link } from 'react-router-dom'
import { priceLabel, promotionPrice, type PhysicalCatalogProduct } from '@designing-minds/cms'
import { ArrowAffordance } from './icon'
import { Card } from './card'

export function PhysicalProductArtwork({ product, detail = false }: { product: PhysicalCatalogProduct; detail?: boolean }) {
  const image = product.galleryImages[0]
  if (image) {
    return (
      <div className={`flex items-center justify-center overflow-hidden rounded-card bg-surface-alt ${detail ? 'aspect-[4/3] p-5 sm:p-8' : 'h-full w-full'}`}>
        <img
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading={detail ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  return (
    <div
      role="img"
      aria-label={`${product.title} product preview not available`}
      className={`flex flex-col items-center justify-center gap-4 overflow-hidden rounded-card bg-surface-alt text-center ${detail ? 'aspect-[4/3] p-8' : 'h-full w-full'}`}
    >
      <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="h-28 w-28 text-primary-ink/55 sm:h-36 sm:w-36">
        <path d="M26 45h68l-6 55H32l-6-55Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="m42 46 2-13c1-8 7-13 16-13s15 5 16 13l2 13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M46 68c4 4 8 6 14 6s10-2 14-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-label font-semibold text-ink-soft">Product preview</span>
    </div>
  )
}

function displayPrice(product: PhysicalCatalogProduct) {
  const available = product.variants.filter((variant) => variant.available)
  const prices = (available.length > 0 ? available : product.variants).map((variant) => variant.unitPriceZar ?? promotionPrice(product))
  const price = prices.length > 0 ? Math.min(...prices) : promotionPrice(product)
  return `${product.variants.some((variant) => (variant.unitPriceZar ?? promotionPrice(product)) !== price) ? 'From ' : ''}${priceLabel(price)}${product.pricingMode === 'per_character' ? ' per letter' : ''}`
}

export function PhysicalProductCard({ product }: { product: PhysicalCatalogProduct }) {
  const href = `/shop/${product.slug}`
  const inStock = product.variants.some((variant) => variant.available)

  return (
    <Card as="article" variant="surface" pad="none" className="catalog-card catalog-card-product group flex min-w-0 flex-col">
      <Link to={href} aria-label={`View ${product.title}`} className="catalog-card-media">
        <div className="w-full">
          <PhysicalProductArtwork product={product} />
        </div>
      </Link>
      <div className="catalog-card-body">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-pill bg-surface-sunk px-2.5 py-1 text-caption font-semibold text-ink-soft">Physical</span>
          <span className={`text-caption font-semibold ${inStock ? 'text-primary-ink' : 'text-muted'}`}>{inStock ? 'In stock' : 'Out of stock'}</span>
        </div>
        <Link to={href} className="inline-flex min-h-6 items-center py-0.5">
          <h3 className="catalog-card-title transition-colors group-hover:text-primary-ink">{product.title}</h3>
        </Link>
        <p className="catalog-card-description">{product.shortDescription.trim() || 'Choose your options and add this product to your cart.'}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <span className="catalog-card-price">{displayPrice(product)}</span>
          <span className="inline-flex min-h-6 shrink-0 items-center gap-1 text-label font-semibold text-primary-ink group-hover:text-primary-ink-strong">
            View product <ArrowAffordance size="sm" />
          </span>
        </div>
      </div>
    </Card>
  )
}
