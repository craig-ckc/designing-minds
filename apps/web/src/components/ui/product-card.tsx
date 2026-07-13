import { Link } from 'react-router-dom'
import { type Product, priceLabel } from '@designing-minds/cms'
import { Button } from './button'
import { Card } from './card'
import { Icon } from './icon'
import { ProductCover } from './product-cover'
import { addCartSlug, removeCartSlug } from '../../lib/cart'
import { useCartSlugs } from '../../lib/use-cart'

export function ProductCard({ product }: { product: Product }) {
  const inCart = useCartSlugs().includes(product.slug)
  const href = `/shop/${product.slug}`

  return (
    <Card
      as="article"
      variant="surface"
      pad="none"
      className="group flex flex-col rounded-lg transition-colors duration-200 hover:border-primary/40"
    >
      <Link to={href} aria-label={`View ${product.title}`} className="block">
        <ProductCover product={product} />
      </Link>

      {/* Title + price */}
      <div className="flex flex-1 flex-col p-3 pt-0">
        <Link to={href}>
          <h3 className="text-body-lg font-bold leading-snug tracking-[-0.01em] transition-colors line-clamp-2 group-hover:text-primary">
            {product.title}
          </h3>
        </Link>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="text-[1.2rem] font-extrabold text-primary">{priceLabel(product.priceZar)}</span>
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
