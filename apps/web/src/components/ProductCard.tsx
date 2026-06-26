import { Link } from 'react-router-dom'
import { type Product, priceLabel } from '@designing-minds/cms'
import { Placeholder } from './ui/Placeholder'
import { Chip } from './ui/Chip'
import { Button } from './ui/Button'
import { addCartSlug } from '../lib/cart'
import { useCartSlugs } from '../lib/useCart'

export function ProductCard({ product }: { product: Product }) {
  const inCart = useCartSlugs().includes(product.slug)
  return (
    <article className="flex flex-col overflow-hidden border border-line bg-surface transition hover:border-ink">
      <Link to={`/product/${product.slug}`} className="block relative">
        <div className="flex flex-wrap items-center gap-2 absolute top-3 left-3 z-10">
          {/* <Badge tone={KIND_TONE[product.productKind]}>{product.productKind}</Badge> */}
          <Chip>{product.productKind}</Chip>
          <Chip>{product.grade}</Chip>
          <Chip>{product.term}</Chip>
        </div>
        <Placeholder ratio="4 / 3" label={product.resourceFormat} className="rounded-none" />
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-[18px]">
        <Link to={`/product/${product.slug}`} className="hover:opacity-70">
          <h4 className="line-clamp-2 text-[1.02rem] leading-snug">{product.title}</h4>
        </Link>
        <p className="line-clamp-2 flex-1 text-sm text-muted">{product.shortDescription}</p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <span className="font-semibold">{priceLabel(product.priceZar)}</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button to={`/product/${product.slug}`} variant="outline" size="sm">
              View
            </Button>
            {inCart ? (
              <Button to="/cart" variant="soft" size="sm">
                In cart
              </Button>
            ) : (
              <Button type="button" variant="solid" size="sm" onClick={() => addCartSlug(product.slug)}>
                Add to cart
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
