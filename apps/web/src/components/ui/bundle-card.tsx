import { CatalogPrice } from './catalog-price'
import { Link } from 'react-router-dom'
import { bundleContents, bundleValue, type Bundle, type CmsSnapshot } from '@designing-minds/cms'
import { cn } from '@designing-minds/utils'
import { Button } from './button'
import { Card } from './card'
import { Icon } from './icon'
import { ProductCover } from './product-cover'
import { ProductMedia } from './product-media'
import { addCartSlug, removeCartSlug } from '../../lib/cart'
import { catalogDescription } from '../../lib/product-attributes'
import { useCartSlugs } from '../../lib/use-cart'

/**
 * Catalogue card for a bundle. Deliberately the same shape and rhythm as
 * ProductCard — a shopper scanning the grid shouldn't have to learn a second
 * card — with a stacked cover and value derived from its included resources.
 *
 * A bundle has no subjects of its own; they come from its members, which is
 * also what drives the cover art.
 */
export function BundleCard({
  bundle,
  snapshot,
  className = '',
}: {
  bundle: Bundle
  snapshot: CmsSnapshot
  /** Optional placement or sizing supplied by the caller. */
  className?: string
}) {
  const inCart = useCartSlugs().includes(bundle.slug)
  const href = `/shop/${bundle.slug}`
  const contents = bundleContents(snapshot, bundle)
  const subjects = [...new Set(contents.flatMap((product) => product.subjects))]
  const value = bundleValue(snapshot, bundle)
  const descriptionFallback = contents.length > 0
    ? 'Browse the resources included in this bundle.'
    : 'Included resources are being finalised.'

  return (
    <Card
      as="article"
      variant="surface"
      pad="none"
      className={cn(
        'catalog-card catalog-card-bundle group flex min-w-0 flex-col overflow-hidden',
        className,
      )}
    >
      <div className="catalog-card-media">
        <Link to={href} aria-label={`View ${bundle.title}`} className="block">
          <ProductMedia alt="" className="rounded-none">
            <div className="absolute inset-0 grid place-items-center">
              <div className="w-3/5 max-w-64 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]">
                <ProductCover
                  product={{ title: bundle.title, grade: bundle.grade, term: bundle.term, subjects }}
                  stacked
                />
              </div>
            </div>
          </ProductMedia>
        </Link>
        {value && value.savingPercent > 0 ? (
          <span className="absolute left-4 top-4 rounded-full bg-canvas px-3 py-1 text-caption font-semibold text-primary-ink">
            Save {value.savingPercent}%
          </span>
        ) : null}
      </div>

      <div className="catalog-card-body">
        <Link to={href} className="inline-flex min-h-6 items-center py-0.5">
          <h3 className="catalog-card-title transition-colors group-hover:text-primary-ink">
            {bundle.title}
          </h3>
        </Link>

        <p className="catalog-card-description">{catalogDescription(bundle.shortDescription, descriptionFallback)}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <span className="catalog-card-price"><CatalogPrice record={bundle} compareAtPriceZar={value?.singlesTotalZar} /></span>
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
