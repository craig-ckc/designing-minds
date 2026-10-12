import { CatalogPrice } from './catalog-price'
import { Link } from 'react-router-dom'
import { type Product } from '@designing-minds/cms'
import { Button } from './button'
import { Card } from './card'
import { Icon } from './icon'
import { ProductCover } from './product-cover'
import { addCartSlug, removeCartSlug } from '../../lib/cart'
import { catalogDescription, productAttributeLine } from '../../lib/product-attributes'
import { useCartSlugs } from '../../lib/use-cart'

export function ProductCard({ product }: { product: Product }) {
  const inCart = useCartSlugs().includes(product.slug)
  const href = `/shop/${product.slug}`

  return (
    <Card
      as="article"
      variant="surface"
      pad="none"
      className="catalog-card catalog-card-product group flex min-w-0 flex-col"
    >
      <Link to={href} aria-label={`View ${product.title}`} className="catalog-card-media">
        <div className="w-3/5 max-w-64 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]">
          <ProductCover product={product} />
        </div>
      </Link>

      <div className="catalog-card-body">
        <Link to={href} className="inline-flex min-h-6 items-center py-0.5">
          <h3 className="catalog-card-title transition-colors group-hover:text-primary-ink">
            {product.title}
          </h3>
        </Link>
        <p className="catalog-card-description">
          {catalogDescription(product.shortDescription, productAttributeLine(product))}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <span className="catalog-card-price"><CatalogPrice record={product} /></span>
          {inCart ? (
            <Button
              size="icon"
              shape="circle"
              variant="solid"
              onClick={() => removeCartSlug(product.slug)}
              aria-label={`Remove ${product.title} from cart`}
              className="flex-none"
            >
              <Icon name="trash" size={16} />
            </Button>
          ) : (
            <Button
              size="icon"
              shape="circle"
              variant="solid-light"
              onClick={() => addCartSlug(product.slug)}
              aria-label={`Add ${product.title} to cart`}
              className="flex-none hover:bg-primary hover:text-on-primary"
            >
              <Icon name="cart" size={16} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
