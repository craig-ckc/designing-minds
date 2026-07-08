import { Link } from 'react-router-dom'
import { type CmsSnapshot, priceLabel, publishedProducts } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Placeholder } from '../components/ui/placeholder'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
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
                <li key={item.slug} className="flex gap-4 border border-line bg-surface p-4">
                  <Placeholder label={item.resourceFormat} className="aspect-[4/3] w-28 flex-none rounded-none" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/product/${item.slug}`} className="font-medium hover:opacity-70">
                        {item.title}
                      </Link>
                      <strong>{priceLabel(item.priceZar)}</strong>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{item.grade}</Badge>
                      <Badge>{item.term}</Badge>
                    </div>
                    <Button
                      type="button"
                      onClick={() => remove(item.slug)}
                      className="mt-auto self-start text-label text-muted underline underline-offset-4 hover:text-ink"
                    >
                      Remove
                    </Button>
                  </div>
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
