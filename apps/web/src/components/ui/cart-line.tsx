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
 * `context="cart"` is the editable row: 96px media, ghost delete button, and
 * for physical lines a quantity stepper. `context="summary"` is the read-only
 * row for checkout and order receipts: 56px media, price right-aligned, no
 * controls. Digital quantity is always 1, so digital lines never show one.
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
  /** Line price; the caller decides about struck-through original prices. */
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
  const mediaBox = href && cartContext
    ? <Link to={href} tabIndex={-1} aria-hidden="true" className={cn('block flex-none', 'w-24')}>{media}</Link>
    : <div className={cn('flex-none', cartContext ? 'w-24' : 'w-14')}>{media}</div>
  const titleNode = href && cartContext
    ? <Link to={href} className="text-h6 text-ink transition-colors hover:text-primary-ink">{title}</Link>
    : <span className={cartContext ? 'text-h6 text-ink' : 'text-label font-semibold text-ink'}>{title}</span>

  return (
    <li className={cn('flex min-w-0 gap-4', cartContext && 'rounded-md bg-surface p-4', className)}>
      {mediaBox}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">{titleNode}</div>
          {cartContext && onRemove ? (
            <Button
              type="button"
              size="icon"
              shape="circle"
              variant="ghost"
              aria-label={removeLabel ?? `Remove ${title} from cart`}
              onClick={(event) => onRemove(event.currentTarget)}
              className="-mr-1 -mt-1 flex-none"
            >
              <Icon name="trash" size={16} />
            </Button>
          ) : null}
          {!cartContext ? <span className="flex-none text-label tabular-nums text-ink">{price}</span> : null}
        </div>
        {meta ? <p className="text-caption text-muted">{meta}</p> : null}
        {options ? <p className="break-words text-caption text-ink-soft">{options}</p> : null}
        {cartContext ? <strong className="text-body font-semibold text-ink">{price}</strong> : null}
        {cartContext && type === 'physical' && onQuantityChange ? (
          <div className="mt-2">
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
        {alert ? <p role="alert" className="text-body text-danger">{alert}</p> : null}
        {quantityError ? <p role="alert" className="text-body text-danger">{quantityError}</p> : null}
      </div>
    </li>
  )
}
