import { Link } from 'react-router-dom'
import { type Product, priceLabel } from '@designing-minds/cms'
import { Icon } from './icon'
import { ProductCover } from './product-cover'
import { addCartSlug } from '../../lib/cart'
import { useCartSlugs } from '../../lib/use-cart'

export function ProductCard({ product }: { product: Product }) {
  const inCart = useCartSlugs().includes(product.slug)
  const href = `/product/${product.slug}`

  return (
    <article className="group flex flex-col rounded-2xl bg-surface-alt p-3 transition-shadow duration-200 hover:shadow-card">
      <Link to={href} className="block">
        <ProductCover product={product} />
      </Link>

      {/* Title + price */}
      <div className="flex flex-1 flex-col px-1 pb-0.5 pt-3">
        <Link to={href}>
          <h3 className="text-[1.02rem] font-bold leading-snug tracking-[-0.01em] transition-colors line-clamp-2 group-hover:text-primary">
            {product.title}
          </h3>
        </Link>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="text-[1.2rem] font-extrabold text-primary">{priceLabel(product.priceZar)}</span>
          {inCart ? (
            <Link
              to="/cart"
              aria-label="In cart — view cart"
              className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary text-white shadow-soft"
            >
              <span className="h-4 w-4">
                <Icon name="check" />
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => addCartSlug(product.slug)}
              aria-label={`Add ${product.title} to cart`}
              className="grid h-10 w-10 flex-none place-items-center rounded-full bg-surface text-ink shadow-soft transition-colors hover:bg-primary hover:text-white"
            >
              <span className="h-4 w-4">
                <Icon name="plus" />
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
