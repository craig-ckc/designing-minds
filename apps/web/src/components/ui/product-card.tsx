import { Link } from 'react-router-dom'
import { type Product, priceLabel } from '@designing-minds/cms'
import { Button } from './button'
import { Card } from './card'
import { Icon } from './icon'
import { ProductCover } from './product-cover'
import { addCartSlug } from '../../lib/cart'
import { useCartSlugs } from '../../lib/use-cart'

export function ProductCard({ product }: { product: Product }) {
  const inCart = useCartSlugs().includes(product.slug)
  const href = `/product/${product.slug}`

  return (
    <Card
      as="article"
      variant="surfaceAlt"
      pad="none"
      className="group flex flex-col p-3 transition-shadow duration-200 hover:shadow-card"
    >
      <Link to={href} className="block">
        <ProductCover product={product} />
      </Link>

      {/* Title + price */}
      <div className="flex flex-1 flex-col px-1 pb-0.5 pt-3">
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
              to="/cart"
              aria-label="In cart — view cart"
              className="flex-none"
            >
              <Icon name="check" size={16} />
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
              <Icon name="plus" size={16} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
