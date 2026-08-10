import { Link } from 'react-router-dom'
import { bundleContents, priceLabel, type Bundle, type CmsSnapshot } from '@designing-minds/cms'
import { Button } from './button'
import { Card } from './card'
import { Icon } from './icon'
import { ProductCover } from './product-cover'
import { addCartSlug, removeCartSlug } from '../../lib/cart'
import { useCartSlugs } from '../../lib/use-cart'

/**
 * Catalogue card for a bundle. Deliberately the same shape and rhythm as
 * ProductCard — a shopper scanning the grid shouldn't have to learn a second
 * card — with two additions that only a bundle can carry: a stacked cover and
 * how many resources are inside.
 *
 * A bundle has no subjects of its own; they come from its members, which is
 * also what drives the cover art.
 */
export function BundleCard({ bundle, snapshot }: { bundle: Bundle; snapshot: CmsSnapshot }) {
  const inCart = useCartSlugs().includes(bundle.slug)
  const href = `/shop/${bundle.slug}`
  const contents = bundleContents(snapshot, bundle)
  const subjects = [...new Set(contents.flatMap((product) => product.subjects))]

  return (
    <Card
      as="article"
      variant="surface"
      pad="none"
      className="group flex flex-col rounded-lg transition-colors duration-200 hover:border-primary/40"
    >
      <Link to={href} aria-label={`View ${bundle.title}`} className="block">
        <ProductCover
          product={{ title: bundle.title, grade: bundle.grade, term: bundle.term, subjects }}
          stacked
        />
      </Link>

      <div className="flex flex-1 flex-col p-3 pt-0">
        <Link to={href} className="inline-flex min-h-6 items-center py-0.5">
          <h3 className="text-body-lg font-bold leading-snug tracking-[-0.01em] transition-colors line-clamp-2 group-hover:text-primary-ink">
            {bundle.title}
          </h3>
        </Link>

        {contents.length > 0 ? (
          <p className="pt-1 text-body-sm text-muted">
            {contents.length} resource{contents.length === 1 ? '' : 's'}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="text-[1.2rem] font-extrabold text-primary">{priceLabel(bundle.priceZar)}</span>
          {inCart ? (
            <Button
              size="icon"
              shape="circle"
              variant="solid"
              onClick={() => removeCartSlug(bundle.slug)}
              aria-label={`Remove ${bundle.title} from cart`}
              className="flex-none"
            >
              <Icon name="trash" size={16} />
            </Button>
          ) : (
            <Button
              size="icon"
              shape="circle"
              variant="solid-light"
              onClick={() => addCartSlug(bundle.slug)}
              aria-label={`Add ${bundle.title} to cart`}
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
