import { Link } from 'react-router-dom'
import { Icon } from '../../ui/icon'
import { initials, useAuth } from '../../../lib/auth'
import { useCartSlugs } from '../../../lib/use-cart'
import { usePhysicalCartLines } from '../../../lib/physical-cart'

const actionLink =
  'inline-flex items-center gap-2 rounded-pill px-3 py-2 text-body-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink'

/** Cart link with an item-count badge (presentational; see CartLink for the live count). */
export function CartLinkView({ count: cartCount, onNavigate }: { count: number; onNavigate?: () => void }) {
  const cartLabel = `Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`

  return (
    <Link to="/cart" onClick={onNavigate} aria-label={cartLabel} className={actionLink}>
      <span className="relative inline-flex">
        <Icon name="cart" size={16} />
        {cartCount > 0 ? (
          <span className="absolute -right-2.5 -top-2.5 grid min-h-4 min-w-4 place-items-center rounded-pill bg-primary-deep px-1 text-[0.625rem] font-extrabold leading-none text-on-primary ring-2 ring-canvas">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        ) : null}
      </span>
      <span className="hidden sm:inline">Cart</span>
    </Link>
  )
}

/** Cart link wired to the live cart. */
export function CartLink({ onNavigate }: { onNavigate?: () => void }) {
  const cartCount = useCartSlugs().length + usePhysicalCartLines().reduce((sum, line) => sum + line.quantity, 0)
  return <CartLinkView count={cartCount} onNavigate={onNavigate} />
}

/** Signed-in avatar link to the account, or a log-in icon link for guests. */
export function AccountLink({ onNavigate }: { onNavigate?: () => void }) {
  const { customer } = useAuth()

  if (customer) {
    return (
      <Link
        to="/account"
        onClick={onNavigate}
        aria-label={`${customer.name} — Customer account`}
        title={`${customer.name} — Customer Account`}
        className="flex items-center gap-2 rounded-pill p-1 text-body-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
      >
        <span className="grid h-8 w-8 flex-none place-items-center rounded-pill bg-primary-deep text-caption font-bold tracking-[0.02em] text-on-primary">
          {initials(customer.name)}
        </span>
      </Link>
    )
  }

  return (
    <Link to="/login" onClick={onNavigate} aria-label="Log in to your account" className={actionLink}>
      <Icon name="user" size={16} />
    </Link>
  )
}

/** Cart + account, shared by the bar at every breakpoint. */
export function AccountActions({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <CartLink onNavigate={onNavigate} />
      <AccountLink onNavigate={onNavigate} />
    </>
  )
}
