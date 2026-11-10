import { useState } from 'react'
import { Link } from 'react-router-dom'
import { physicalUnitPriceZar, priceLabel, quantityValidation, type PhysicalCartLine, type PhysicalCatalogProduct } from '@designing-minds/cms'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { commerceFieldLabel } from '../lib/commerce-label'
import { removePhysicalCartLine, updatePhysicalCartLine } from '../lib/physical-cart'
import { useAnnounce } from './ui/live-region'

export function PhysicalCartLines({ lines, catalogue, fallbackFocusSelector }: { lines: PhysicalCartLine[]; catalogue: PhysicalCatalogProduct[]; fallbackFocusSelector: string }) {
  return <>{lines.map((line) => <PhysicalCartRow key={line.id} line={line} product={catalogue.find((product) => product.slug === line.productSlug)} fallbackFocusSelector={fallbackFocusSelector} />)}</>
}

function PhysicalCartRow({ line, product, fallbackFocusSelector }: { line: PhysicalCartLine; product?: PhysicalCatalogProduct; fallbackFocusSelector: string }) {
  const [quantityText, setQuantityText] = useState(String(line.quantity))
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const variant = product?.variants.find((entry) => entry.id === line.variantId)
  const unitPrice = product && variant ? physicalUnitPriceZar(product, variant, line.customizations) : 0
  const title = product?.title ?? line.productSlug
  const configuration = [...Object.values(variant?.optionValues ?? {}), ...Object.values(line.customizations)].join(', ')
  const accessibleTitle = configuration ? `${title}, ${configuration}` : title
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
  return <li className="grid gap-3 rounded-card border border-line bg-surface p-4">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        {product?.galleryImages[0] ? <img className="h-20 w-20 flex-none rounded-control object-cover" src={product.galleryImages[0].url} alt={product.galleryImages[0].alt || title} /> : <span className="grid h-16 w-16 flex-none place-items-center rounded-control bg-primary-tint"><Icon name="cart" /></span>}
        <div className="min-w-0"><Link to={`/shop/${line.productSlug}`} className="font-semibold hover:text-primary-ink">{title}</Link>
          <p className="text-label text-muted">Physical product</p>
          {variant ? <p className="text-body-sm text-ink-soft">{Object.entries(variant.optionValues).map(([key, value]) => `${commerceFieldLabel(key, product)}: ${value}`).join(' · ')}</p> : null}
          {Object.entries(line.customizations).map(([key, value]) => <p key={key} className="break-words text-body-sm text-ink-soft">{commerceFieldLabel(key, product)}: <strong>{value}</strong></p>)}
        </div>
      </div>
      <Button type="button" size="icon" variant="solid-light" aria-label={`Remove ${accessibleTitle} from cart`} onClick={(event) => remove(event.currentTarget)}><Icon name="trash" size={16} /></Button>
    </div>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <label className="grid gap-1 text-label font-semibold">Quantity<input aria-label={`Quantity for ${accessibleTitle}`} className="field w-24" type="number" min="1" step="1" value={editing ? quantityText : String(line.quantity)} onFocus={() => { setEditing(true); setQuantityText(String(line.quantity)) }} onBlur={() => setEditing(false)} onChange={(event) => {
        setQuantityText(event.target.value)
        const quantity = Number(event.target.value)
        const issue = quantityValidation(quantity)
        setError(issue)
        if (!issue) updatePhysicalCartLine(line.id, quantity)
      }} /></label>
      <strong>{product && variant ? priceLabel(unitPrice * line.quantity) : 'Unavailable'}</strong>
    </div>
    {!variant?.available ? <p role="alert" className="text-body-sm text-danger">This option is currently unavailable. Please remove it or choose another option.</p> : null}
    {error ? <p role="alert" className="text-body-sm text-danger">{error}</p> : null}
  </li>
}
