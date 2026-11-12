import { CatalogPrice } from './catalog-price'
import { Link } from 'react-router-dom'
import { priceLabel, promotionPrice, type PhysicalCatalogProduct, type Product } from '@designing-minds/cms'
import { Button } from './button'
import { Card } from './card'
import { Icon } from './icon'
import { ProductCover } from './product-cover'
import { ProductMedia } from './product-media'
import { addCartSlug, removeCartSlug } from '../../lib/cart'
import { catalogDescription, productAttributeLine } from '../../lib/product-attributes'
import { useCartSlugs } from '../../lib/use-cart'

const isPhysical = (product: Product | PhysicalCatalogProduct): product is PhysicalCatalogProduct =>
  (product as { productType?: string }).productType === 'physical'

/** Lowest available variant price, with "From" / "per letter" qualifiers. */
function physicalPrice(product: PhysicalCatalogProduct) {
  const available = product.variants.filter((variant) => variant.available)
  const prices = (available.length > 0 ? available : product.variants).map((variant) => variant.unitPriceZar ?? promotionPrice(product))
  const price = prices.length > 0 ? Math.min(...prices) : promotionPrice(product)
  const varies = product.variants.some((variant) => (variant.unitPriceZar ?? promotionPrice(product)) !== price)
  return `${varies ? 'From ' : ''}${priceLabel(price)}${product.pricingMode === 'per_character' ? ' per letter' : ''}`
}

/** Existing sale logic only: a live promotion price below the regular price. */
function discountPercent(product: Product | PhysicalCatalogProduct) {
  const price = promotionPrice(product)
  return price < product.priceZar ? Math.round((1 - price / product.priceZar) * 100) : 0
}

const badge = 'rounded-full px-3 py-1 text-caption font-semibold'

/**
 * The one catalogue card for digital resources and physical products (code
 * twin of Figma's ProductCard). Bundles keep their own BundleCard.
 */
export function ProductCard({ product }: { product: Product | PhysicalCatalogProduct }) {
  const physical = isPhysical(product)
  const href = `/shop/${product.slug}`
  const discount = discountPercent(product)
  const outOfStock = physical && !product.variants.some((variant) => variant.available)
  const image = physical ? product.galleryImages[0] : undefined

  return (
    <Card as="article" variant="surface" pad="none" className="catalog-card catalog-card-product group flex min-w-0 flex-col overflow-hidden">
      <div className="catalog-card-media">
        <Link to={href} aria-label={`View ${product.title}`} className="block">
          {physical ? (
            <ProductMedia
              src={image?.url}
              alt={image?.alt ?? ''}
              width={image?.width}
              height={image?.height}
              fit="cover"
              className="rounded-none"
            />
          ) : (
            <ProductMedia alt="" className="rounded-none">
              <div className="absolute inset-0 grid place-items-center">
                <div className="w-3/5 max-w-64 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]">
                  <ProductCover product={product} />
                </div>
              </div>
            </ProductMedia>
          )}
        </Link>
        {discount > 0 ? <span className={`${badge} absolute left-4 top-4 bg-canvas text-primary-ink`}>Save {discount}%</span> : null}
        {outOfStock ? <span className={`${badge} absolute right-4 top-4 bg-ink text-canvas`}>Out of stock</span> : null}
      </div>

      <div className="catalog-card-body">
        <Link to={href} className="inline-flex min-h-6 items-center py-0.5">
          <h3 className="catalog-card-title transition-colors group-hover:text-primary-ink">{product.title}</h3>
        </Link>
        <p className="catalog-card-description">
          {physical
            ? product.shortDescription.trim() || 'Choose your options and add this product to your cart.'
            : catalogDescription(product.shortDescription, productAttributeLine(product))}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <span className="catalog-card-price">{physical ? physicalPrice(product) : <CatalogPrice record={product} />}</span>
          {physical ? (
            <Button
              to={href}
              size="icon"
              shape="circle"
              variant="solid-light"
              aria-label={`Choose options for ${product.title}`}
              className="flex-none hover:bg-primary hover:text-on-primary"
            >
              <Icon name="cart" size={16} />
            </Button>
          ) : (
            <DigitalCartButton slug={product.slug} title={product.title} />
          )}
        </div>
      </div>
    </Card>
  )
}

function DigitalCartButton({ slug, title }: { slug: string; title: string }) {
  const inCart = useCartSlugs().includes(slug)
  return inCart ? (
    <Button size="icon" shape="circle" variant="solid" onClick={() => removeCartSlug(slug)} aria-label={`Remove ${title} from cart`} className="flex-none">
      <Icon name="trash" size={16} />
    </Button>
  ) : (
    <Button size="icon" shape="circle" variant="solid-light" onClick={() => addCartSlug(slug)} aria-label={`Add ${title} to cart`} className="flex-none hover:bg-primary hover:text-on-primary">
      <Icon name="cart" size={16} />
    </Button>
  )
}
