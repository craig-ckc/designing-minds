import { CatalogPrice } from '../components/ui/catalog-price'
import { Link } from 'react-router-dom'
import { bundleContents, priceLabel, promotionPrice, resolveCartItems } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Button } from '../components/ui/button'
import { Icon } from '../components/ui/icon'
import { EmptyState } from '../components/ui/empty-state'
import { ProductCover } from '../components/ui/product-cover'
import { useCatalogSnapshot } from '../lib/catalog'
import { useNoindex } from '../lib/use-noindex'
import { removeCartSlug } from '../lib/cart'
import { useCartSlugs } from '../lib/use-cart'
import { usePhysicalCartLines } from '../lib/physical-cart'
import { PhysicalCartLines } from '../components/physical-cart-lines'
import { physicalUnitPriceZar } from '@designing-minds/cms'
import { useAnnounce } from '../components/ui/live-region'

export function CartPage() {
  const snapshot = useCatalogSnapshot()
  useNoindex()
  const slugs = useCartSlugs()
  const physicalLines = usePhysicalCartLines()
  const announce = useAnnounce()
  const physicalCatalogue = snapshot.physicalCatalog ?? []
  const physicalTotal = physicalLines.reduce((sum, line) => {
    const product = physicalCatalogue.find((entry) => entry.slug === line.productSlug)
    const variant = product?.variants.find((entry) => entry.id === line.variantId)
    return sum + (product && variant ? physicalUnitPriceZar(product, variant, line.customizations) * line.quantity : 0)
  }, 0)
  // Slugs name both Collections in the shared /shop space, so bundles must
  // resolve here too — a products-only lookup drops them and the cart reads empty.
  const items = resolveCartItems(snapshot, slugs)

  const subtotal = items.reduce(
    (sum, item) => sum + promotionPrice(item.kind === 'product' ? item.product : item.bundle),
    physicalTotal,
  )
  const lineCount = items.length + physicalLines.reduce((sum, line) => sum + line.quantity, 0)
  const remove = (slug: string, title: string, button: HTMLButtonElement) => {
    const row = button.closest('li')
    const nextAction = row?.nextElementSibling?.querySelector<HTMLButtonElement>('button[aria-label^="Remove "]')
    const previousAction = row?.previousElementSibling?.querySelector<HTMLButtonElement>('button[aria-label^="Remove "]')
    const target = nextAction ?? previousAction
    removeCartSlug(slug)
    announce(`${title} removed from cart.`)
    window.setTimeout(() => {
      if (document.activeElement !== document.body) return
      const fallback = document.querySelector<HTMLElement>('[data-cart-empty-action]')
      ;(target?.isConnected ? target : fallback)?.focus()
    }, 0)
  }

  return (
    <section className="section-tight">
      <Container>
        <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Cart" />
        {lineCount > 0 ? <h1 data-cart-heading tabIndex={-1} className="mb-6 text-page-title">Your cart</h1> : null}

        {lineCount === 0 ? (
          <EmptyState as="h1" icon="cart" title="Your cart is empty" description="Add a resource or bundle to get started. Your selections will appear here.">
            <Button to="/shop" variant="solid" data-cart-empty-action>Browse resources</Button>
          </EmptyState>
        ) : (
          <div className="grid items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
            <ul className="grid gap-4">
              {items.map((item) => {
                // A bundle carries no subjects of its own — the cover and the
                // detail line read them off its published members instead.
                const contents = item.kind === 'bundle' ? bundleContents(snapshot, item.bundle) : []
                const subjects =
                  item.kind === 'product'
                    ? item.product.subjects
                    : [...new Set(contents.flatMap((entry) => entry.subjects))]
                const record = item.kind === 'product' ? item.product : item.bundle
                const detail =
                  item.kind === 'product'
                    ? `${record.grade} · ${record.term}`
                    : `Bundle · ${record.grade} · ${record.term}${contents.length > 0 ? ` · ${contents.length} resource${contents.length === 1 ? '' : 's'}` : ''}`
                return (
                  <li key={record.slug} className="flex items-center gap-4 rounded-card bg-surface p-4">
                    <Link to={`/shop/${record.slug}`} className="w-20 flex-none sm:w-[88px]">
                      <ProductCover
                        product={{ title: record.title, grade: record.grade, term: record.term, subjects }}
                        stacked={item.kind === 'bundle'}
                      />
                    </Link>
                    <div className="flex flex-1 flex-col gap-1">
                      <Link
                        to={`/shop/${record.slug}`}
                        className="font-bold leading-snug tracking-[-0.01em] transition-colors line-clamp-2 hover:text-primary-ink"
                      >
                        {record.title}
                      </Link>
                      <span className="text-body-sm text-muted">{detail}</span>
                      <strong className="mt-0.5 text-[1.15rem] font-extrabold text-primary-ink">
                        <CatalogPrice record={record} />
                      </strong>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      shape="circle"
                      variant="solid-light"
                      onClick={(event) => remove(record.slug, record.title, event.currentTarget)}
                      aria-label={`Remove ${record.title} from cart`}
                      className="flex-none self-start transition-colors hover:border-danger hover:bg-danger hover:text-on-primary"
                    >
                      <Icon name="trash" size={16} />
                    </Button>
                  </li>
                )
              })}
              <PhysicalCartLines lines={physicalLines} catalogue={physicalCatalogue} fallbackFocusSelector="[data-cart-heading]" />
            </ul>

            <aside className="grid gap-4 rounded-card border border-line p-6 lg:sticky lg:top-[var(--sticky-offset)]">
              <h2 className="text-xl">Order summary</h2>
              <div className="grid gap-2 text-body">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal ({lineCount} items)</span>
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
              <p className="text-label text-muted">{physicalLines.length ? 'Delivery is calculated at checkout. Digital downloads unlock after payment.' : 'Digital products · No shipping · Download after payment.'}</p>
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
