import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { quantityValidation, type ProductImage } from '@designing-minds/cms'
import { cn } from '@designing-minds/utils'
import { Button } from './button'
import { Icon } from './icon'
import { ProductMedia } from './product-media'
import { QuantityInput } from './quantity-input'

type LineImage = Pick<ProductImage, 'url' | 'alt'> & Partial<Pick<ProductImage, 'width' | 'height'>>

/**
 * One purchased line (code twin of Figma's CartLine).
 *
 * `context="cart"` is the editable row: 96px media and a solid-light icon
 * delete button. Digital lines keep the delete beside the title; physical lines
 * get a right-hand column with the delete at the top and the quantity stepper at
 * the bottom (the stepper drops under the details on phones).
 * `context="summary"` is the read-only row for checkout and order receipts:
 * 56px media, details, and the price in its own right-hand column; no controls.
 * Digital quantity is always 1, so digital lines never show one.
 *
 * Renders an `<li>`; the caller supplies the surrounding `<ul>`.
 */
export function CartLine({
  type,
  context,
  title,
  href,
  meta,
  options,
  image,
  cover,
  price,
  onRemove,
  removeLabel,
  quantity = 1,
  onQuantityChange,
  quantityLabel,
  alert,
  className,
}: {
  type: 'digital' | 'physical'
  context: 'cart' | 'summary'
  title: string
  href?: string
  /** Muted caption line, e.g. "Bundle · Grade 4 · Term 3 · 4 resources". */
  meta?: string
  /** Physical options and personalisation, e.g. "Colour: Pink · Name: Thandi". */
  options?: string
  /** Product photo (physical); falls back to `cover`, then the empty frame. */
  image?: LineImage
  /** Live cover for digital lines. */
  cover?: ReactNode
  /**
   * Line price; the caller decides about struck-through original prices. In the
   * cart a struck `<s>` price reads as a 12px caption before the price; in a
   * summary the slot is a right-aligned column, so pass the struck price first
   * and it stacks above the current one.
   */
  price: ReactNode
  /** Cart context only. Receives the clicked button (for focus handoff). */
  onRemove?: (button: HTMLButtonElement) => void
  /** Accessible name for the delete button; defaults to "Remove {title} from cart". */
  removeLabel?: string
  quantity?: number
  /** Physical + cart only. Called with a valid whole quantity. */
  onQuantityChange?: (next: number) => void
  quantityLabel?: string
  /** Blocking notice for the line (e.g. unavailable option). */
  alert?: string
  className?: string
}) {
  const cartContext = context === 'cart'
  const physicalCart = cartContext && type === 'physical'
  const [quantityError, setQuantityError] = useState<string | null>(null)
  const media = (
    <ProductMedia
      src={image?.url}
      alt={image?.alt || title}
      width={image?.width}
      height={image?.height}
      fit={image ? 'cover' : 'contain'}
    >
      {!image && cover ? <div className="absolute inset-0 grid place-items-center p-[10%]"><div className="w-full">{cover}</div></div> : null}
    </ProductMedia>
  )
  const mediaPlacement = physicalCart ? 'col-start-1 row-start-1 row-span-2 self-start' : cartContext ? 'self-start' : undefined
  const mediaBox = href && cartContext
    ? <Link to={href} tabIndex={-1} aria-hidden="true" className={cn('block w-24 flex-none', mediaPlacement)}>{media}</Link>
    : <div className={cn('flex-none', cartContext ? 'w-24' : 'w-14', mediaPlacement)}>{media}</div>
  const titleNode = href && cartContext
    ? <Link to={href} className="text-h6 text-ink transition-colors hover:text-primary-ink">{title}</Link>
    : <span className={cartContext ? 'text-h6 text-ink' : 'text-body font-semibold text-ink'}>{title}</span>
  const details = (
    <>
      {meta ? <p className="text-caption text-muted">{meta}</p> : null}
      {options ? <p className="break-words text-caption text-muted">{options}</p> : null}
    </>
  )
  const notices = (
    <>
      {alert ? <p role="alert" className="text-body text-danger">{alert}</p> : null}
      {quantityError ? <p role="alert" className="text-body text-danger">{quantityError}</p> : null}
    </>
  )

  if (!cartContext) {
    return (
      <li className={cn('flex min-w-0 items-center gap-3 py-2', className)}>
        {mediaBox}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {titleNode}
          {details}
          {notices}
        </div>
        <div className="flex flex-none flex-col items-end text-body font-semibold tabular-nums text-ink">{price}</div>
      </li>
    )
  }

  const removeButton = onRemove ? (
    <Button
      type="button"
      size="icon-sm"
      variant="solid-light"
      aria-label={removeLabel ?? `Remove ${title} from cart`}
      onClick={(event) => onRemove(event.currentTarget)}
      className={cn('flex-none', physicalCart && 'col-start-3 row-start-1 justify-self-end')}
    >
      <Icon name="trash" size={16} />
    </Button>
  ) : null
  const priceNode = <strong className="text-body font-semibold text-ink [&_s]:text-caption">{price}</strong>

  if (physicalCart) {
    return (
      <li className={cn('grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 rounded-md bg-surface p-4', className)}>
        {mediaBox}
        <div className="col-start-2 row-start-1 flex min-w-0 flex-col gap-1 sm:row-span-2">
          <div className="min-w-0">{titleNode}</div>
          {details}
          {priceNode}
          {notices}
        </div>
        {removeButton}
        {onQuantityChange ? (
          <div className="col-span-2 col-start-2 row-start-2 mt-3 self-end sm:col-span-1 sm:col-start-3 sm:mt-0 sm:justify-self-end">
            <QuantityInput
              value={quantity}
              onChange={(next) => {
                const issue = quantityValidation(next)
                setQuantityError(issue)
                if (!issue) onQuantityChange(next)
              }}
              label={quantityLabel ?? `Quantity for ${title}`}
              invalid={Boolean(quantityError)}
            />
          </div>
        ) : null}
      </li>
    )
  }

  return (
    <li className={cn('flex min-w-0 gap-4 rounded-md bg-surface p-4', className)}>
      {mediaBox}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">{titleNode}</div>
          {removeButton}
        </div>
        {details}
        {priceNode}
        {notices}
      </div>
    </li>
  )
}
