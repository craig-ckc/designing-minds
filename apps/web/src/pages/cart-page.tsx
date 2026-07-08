import { Link } from 'react-router-dom'
import { type CmsSnapshot, priceLabel, publishedProducts } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Button } from '../components/ui/button'
import { Icon } from '../components/ui/icon'
import { Card } from '../components/ui/card'
import { ProductCover } from '../components/ui/product-cover'
import { useNoindex } from '../lib/use-noindex'
import { removeCartSlug } from '../lib/cart'
import { useCartSlugs } from '../lib/use-cart'

export function CartPage({ snapshot }: { snapshot: CmsSnapshot }) {
  useNoindex()
  const slugs = useCartSlugs()
  const published = publishedProducts(snapshot)

  const items = slugs
    .map((slug) => published.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const subtotal = items.reduce((sum, item) => sum + item.priceZar, 0)
  const remove = (slug: string) => removeCartSlug(slug)

  return (
    <section className="section">
      <Container>
        <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Cart" />
        <h1 className="mb-8 text-page-title">Your cart</h1>

        {items.length === 0 ? (
          <Card variant="surface" pad="lg" className="text-center">
            <h3>Your cart is empty</h3>
            <p className="mt-2 text-muted">Browse the catalogue and add resources to get started.</p>
            <div className="mt-4 flex justify-center">
              <Button to="/shop" variant="solid">
                Browse resources
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
            <ul className="grid gap-4">
              {items.map((item) => (
                <li key={item.slug} className="flex items-center gap-5 rounded-card border border-line bg-surface p-4">
                  <Link to={`/product/${item.slug}`} className="w-20 flex-none sm:w-[88px]">
                    <ProductCover product={item} />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      to={`/product/${item.slug}`}
                      className="font-bold leading-snug tracking-[-0.01em] transition-colors line-clamp-2 hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    <strong className="mt-0.5 text-[1.15rem] font-extrabold text-primary">
                      {priceLabel(item.priceZar)}
                    </strong>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    shape="circle"
                    variant="solid-light"
                    onClick={() => remove(item.slug)}
                    aria-label={`Remove ${item.title} from cart`}
                    className="flex-none self-start transition-colors hover:border-danger hover:bg-danger hover:text-on-primary"
                  >
                    <Icon name="trash" size={16} />
                  </Button>
                </li>
              ))}
            </ul>

            <aside className="grid gap-4 rounded-card border border-line p-6 lg:sticky lg:top-[var(--sticky-offset)]">
              <h3>Order summary</h3>
              <div className="grid gap-2 text-body">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal ({items.length} items)</span>
                  <span>{priceLabel(subtotal)}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-[1.1rem] font-semibold">
                  <span>Total</span>
                  <span>{priceLabel(subtotal)}</span>
                </div>
              </div>
              <Button to="/checkout" variant="solid" className="w-full">
                Proceed to checkout
              </Button>
              <p className="text-label text-muted">Digital products · No shipping · Download after payment.</p>
              <Link to="/shop" className="text-body-sm text-ink underline underline-offset-4">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </Container>
    </section>
  )
}
