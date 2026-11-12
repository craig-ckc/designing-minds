import { physicalUnitPriceZar, priceLabel, type PhysicalCartLine, type PhysicalCatalogProduct } from '@designing-minds/cms'
import { commerceFieldLabel } from '../lib/commerce-label'
import { removePhysicalCartLine, updatePhysicalCartLine } from '../lib/physical-cart'
import { CartLine } from './ui/cart-line'
import { useAnnounce } from './ui/live-region'

/** Editable cart row for a physical line, driven by the live catalogue snapshot. */
export function PhysicalCartRow({ line, product, fallbackFocusSelector }: { line: PhysicalCartLine; product?: PhysicalCatalogProduct; fallbackFocusSelector: string }) {
  const variant = product?.variants.find((entry) => entry.id === line.variantId)
  const unitPrice = product && variant ? physicalUnitPriceZar(product, variant, line.customizations) : 0
  const title = product?.title ?? line.productSlug
  const configuration = [...Object.values(variant?.optionValues ?? {}), ...Object.values(line.customizations)].join(', ')
  const accessibleTitle = configuration ? `${title}, ${configuration}` : title
  const options = Object.entries({ ...variant?.optionValues, ...line.customizations })
    .map(([key, value]) => `${commerceFieldLabel(key, product)}: ${value}`).join(' · ')
  const announce = useAnnounce()
  const remove = (button: HTMLButtonElement) => {
    const row = button.closest('li')
    const nextAction = row?.nextElementSibling?.querySelector<HTMLButtonElement>('button[aria-label^="Remove "]')
    const previousAction = row?.previousElementSibling?.querySelector<HTMLButtonElement>('button[aria-label^="Remove "]')
    const target = nextAction ?? previousAction
    removePhysicalCartLine(line.id)
    announce(`${accessibleTitle} removed from cart.`)
    window.setTimeout(() => {
      if (document.activeElement !== document.body) return
      const fallback = document.querySelector<HTMLElement>('[data-cart-empty-action]')
        ?? document.querySelector<HTMLElement>(fallbackFocusSelector)
      ;(target?.isConnected ? target : fallback)?.focus()
    }, 0)
  }
  return (
    <CartLine
      type="physical"
      context="cart"
      title={title}
      href={`/shop/${line.productSlug}`}
      options={options || undefined}
      image={product?.galleryImages[0]}
      price={product && variant ? priceLabel(unitPrice * line.quantity) : 'Unavailable'}
      quantity={line.quantity}
      quantityLabel={`Quantity for ${accessibleTitle}`}
      onQuantityChange={(next) => updatePhysicalCartLine(line.id, next)}
      removeLabel={`Remove ${accessibleTitle} from cart`}
      onRemove={remove}
      alert={!variant?.available ? 'This option is currently unavailable. Please remove it or choose another option.' : undefined}
    />
  )
}
