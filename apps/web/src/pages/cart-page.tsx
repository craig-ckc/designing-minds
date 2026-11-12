import { CatalogPrice } from '../components/ui/catalog-price'
import { Link } from 'react-router-dom'
import { bundleContents, priceLabel, promotionPrice, resolveCartItems } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/empty-state'
import { ProductCover } from '../components/ui/product-cover'
import { useCatalogSnapshot } from '../lib/catalog'
import { useNoindex } from '../lib/use-noindex'
import { removeCartSlug } from '../lib/cart'
import { useCartSlugs } from '../lib/use-cart'
import { usePhysicalCartLines } from '../lib/physical-cart'
import { PhysicalCartRow } from '../components/physical-cart-row'
import { physicalUnitPriceZar } from '@designing-minds/cms'
import { CartLine } from '../components/ui/cart-line'
import { SummaryRow } from '../components/ui/summary-row'
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
        {lineCount > 0 ? <h1 data-cart-heading tabIndex={-1} className="mb-6 text-h2">Your cart</h1> : null}

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
                  <CartLine
                    key={record.slug}
                    type="digital"
                    context="cart"
                    title={record.title}
                    href={`/shop/${record.slug}`}
                    meta={detail}
                    cover={
                      <ProductCover
                        product={{ title: record.title, grade: record.grade, term: record.term, subjects }}
                        stacked={item.kind === 'bundle'}
                      />
                    }
                    price={<CatalogPrice record={record} />}
                    onRemove={(button) => remove(record.slug, record.title, button)}
                  />
                )
              })}
              {physicalLines.map((line) => <PhysicalCartRow key={line.id} line={line} product={physicalCatalogue.find((product) => product.slug === line.productSlug)} fallbackFocusSelector="[data-cart-heading]" />)}
            </ul>

            <aside className="grid gap-4 rounded-md border border-line p-6 lg:sticky lg:top-[var(--sticky-offset)]">
              <h2 className="text-xl">Order summary</h2>
              <div className="grid gap-3">
                <SummaryRow label={`Subtotal (${lineCount} items)`} value={priceLabel(subtotal)} />
                <SummaryRow label="Total" value={priceLabel(subtotal)} emphasis="total" />
              </div>
              <Button to="/checkout" variant="solid" className="w-full">
                Proceed to checkout
              </Button>
              <p className="text-label text-muted">{physicalLines.length ? 'Delivery is calculated at checkout. Digital downloads unlock after payment.' : 'Digital products · No shipping · Download after payment.'}</p>
              <Link to="/shop" className="text-body text-ink underline underline-offset-4">
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </Container>
    </section>
  )
}
