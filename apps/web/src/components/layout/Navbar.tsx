import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Dialog } from '@base-ui/react/dialog'
import { accessPlanProducts, priceLabel, type CmsSnapshot, type Product } from '@designing-minds/cms'
import { Container } from '../ui/Container'
import { Icon } from '../ui/Icon'
import { initials, useAuth } from '../../lib/auth'
import { CART_CHANGED_EVENT, getCartSlugs } from '../../lib/cart'

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-[0.95rem] hover:bg-surface-alt hover:text-ink ${
    isActive ? 'font-medium text-ink' : 'text-ink-soft'
  }`

const periodLabel = (plan: Product) => (plan.accessPeriod === 'Year' ? 'Full year' : 'One term')

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-3 font-semibold">
      <span className="grid h-[38px] w-[38px] place-items-center rounded-lg bg-ink text-[0.95rem] tracking-[-0.04em] text-white">
        DM
      </span>
      <span className="leading-tight">
        <span className="block text-[1.05rem] tracking-[-0.02em]">Designing Minds</span>
        <span className="block text-[0.68rem] font-normal tracking-[0.04em] text-muted">CAPS-aligned resources</span>
      </span>
    </Link>
  )
}

function AccountControls({ onNavigate }: { onNavigate?: () => void }) {
  const { customer } = useAuth()
  const [cartCount, setCartCount] = useState(() => getCartSlugs().length)

  useEffect(() => {
    const update = () => setCartCount(getCartSlugs().length)
    window.addEventListener(CART_CHANGED_EVENT, update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return (
    <>
      <Link
        to="/cart"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-[0.9rem] text-ink-soft hover:bg-surface-alt hover:text-ink"
      >
        <span className="h-4 w-4">
          <Icon name="cart" />
        </span>
        <span className="hidden sm:inline">Cart ({cartCount})</span>
      </Link>

      {customer ? (
        <Link
          to="/account"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2.5 text-[0.9rem] text-ink-soft hover:bg-surface-alt hover:text-ink"
          title={`${customer.name} — Customer Account`}
        >
          <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-ink text-[0.78rem] font-semibold tracking-[0.02em] text-white">
            {initials(customer.name)}
          </span>
          <span className="hidden max-w-[9ch] truncate sm:inline">{customer.name.split(' ')[0]}</span>
        </Link>
      ) : (
        <Link
          to="/login"
          onClick={onNavigate}
          className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-[0.9rem] text-ink-soft hover:bg-surface-alt hover:text-ink"
        >
          <span className="h-4 w-4">
            <Icon name="user" />
          </span>
          Account
        </Link>
      )}
    </>
  )
}

/** Access-plan card used in the mega menu (and reused in the mobile sheet). */
function PlanCard({ plan, onClose, compact }: { plan: Product; onClose: () => void; compact?: boolean }) {
  return (
    <Link
      to={`/product/${plan.slug}`}
      onClick={onClose}
      className={`group flex flex-col gap-2 rounded-[10px] border p-5 transition hover:border-ink ${
        plan.featured ? 'border-ink' : 'border-line'
      } ${compact ? '' : 'h-full'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted">{periodLabel(plan)}</span>
        {plan.featured ? (
          <span className="rounded-full bg-ink px-2 py-0.5 text-[0.64rem] uppercase tracking-[0.08em] text-white">
            Best value
          </span>
        ) : null}
      </div>
      <span className="font-semibold text-ink">{plan.title}</span>
      <span className="text-[1.3rem] font-semibold tracking-[-0.02em]">{priceLabel(plan.priceZar)}</span>
      {compact ? null : <span className="text-[0.88rem] text-muted">{plan.shortDescription}</span>}
      <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-[0.88rem] font-medium underline underline-offset-4">
        View {plan.accessPeriod === 'Year' ? 'yearly' : 'term'} access
        <span className="h-3.5 w-3.5">
          <Icon name="arrow" />
        </span>
      </span>
    </Link>
  )
}

function ShopMega({ plans, onClose, panelRef }: { plans: Product[]; onClose: () => void; panelRef: RefObject<HTMLDivElement | null> }) {
  return (
    <>
      {/* Visual dim only — outside clicks are handled by a document listener. */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 top-[72px] z-30 bg-ink/10" />
      <div ref={panelRef} className="absolute inset-x-0 top-full z-40 hidden border-t border-line bg-white shadow-sm lg:block">
        <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_1.7fr]">
          {/* Links */}
          <div>
            <h5 className="mb-4 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted">Shop</h5>
            <ul className="grid gap-2.5">
              <MegaLink to="/shop" onClose={onClose} label="All resources" sub="The full catalogue" />
              <MegaLink to="/grades" onClose={onClose} label="Grades" sub="Browse Grades 3–7" />
              <MegaLink to="/bundles" onClose={onClose} label="Bundles & access plans" sub="Save with bundles" />
            </ul>
          </div>

          {/* Access plan cards */}
          <div>
            <h5 className="mb-4 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted">Access plans</h5>
            {plans.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onClose={onClose} />
                ))}
              </div>
            ) : (
              <p className="text-[0.9rem] text-muted">No access plans published yet.</p>
            )}
          </div>
        </Container>
      </div>
    </>
  )
}

function MegaLink({ to, label, sub, onClose }: { to: string; label: string; sub: string; onClose: () => void }) {
  return (
    <li>
      <Link to={to} onClick={onClose} className="group block">
        <span className="font-medium text-ink group-hover:underline group-hover:underline-offset-4">{label}</span>
        <span className="block text-[0.85rem] text-muted">{sub}</span>
      </Link>
    </li>
  )
}

export function Navbar({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const plans = snapshot ? accessPlanProducts(snapshot) : []
  const closeMega = () => setMegaOpen(false)
  const closeMobile = () => setMobileOpen(false)

  // Close both menus whenever the route changes, so navigating to any link —
  // including ones outside the mega menu — dismisses the open panel.
  useEffect(() => {
    queueMicrotask(() => {
      setMegaOpen(false)
      setMobileOpen(false)
    })
  }, [location.pathname])

  // Close the mega menu on any click outside the panel/trigger, or on Escape.
  useEffect(() => {
    if (!megaOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setMegaOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMegaOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [megaOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <Container className="flex min-h-[72px] items-center gap-7">
        <Logo onClick={closeMega} />

        <nav className="ml-3 hidden items-center gap-1 lg:flex">
          <NavLink to="/" end onClick={closeMega} className={navLinkCls}>
            Home
          </NavLink>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMegaOpen((open) => !open)}
            aria-expanded={megaOpen}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[0.95rem] hover:bg-surface-alt hover:text-ink ${
              megaOpen ? 'font-medium text-ink' : 'text-ink-soft'
            }`}
          >
            Shop
            <span className={`h-3.5 w-3.5 transition-transform ${megaOpen ? 'rotate-180' : ''}`}>
              <Icon name="chevron" />
            </span>
          </button>
          <NavLink to="/about" onClick={closeMega} className={navLinkCls}>
            About
          </NavLink>
          <NavLink to="/contact" onClick={closeMega} className={navLinkCls}>
            Contact
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <AccountControls onNavigate={closeMega} />

          {/* Mobile menu */}
          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger className="grid h-10 w-10 place-items-center rounded-md hover:bg-surface-alt lg:hidden">
              <span className="h-5 w-5">
                <Icon name="menu" />
              </span>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm" />
              <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-[84%] max-w-sm flex-col gap-1 overflow-y-auto bg-surface p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-muted">
                    Menu
                  </Dialog.Title>
                  <Dialog.Close className="grid h-9 w-9 place-items-center rounded-md hover:bg-surface-alt">
                    <span className="h-5 w-5">
                      <Icon name="close" />
                    </span>
                  </Dialog.Close>
                </div>

                <NavLink to="/" end onClick={closeMobile} className="py-2 text-[1.05rem]">
                  Home
                </NavLink>
                <p className="mt-3 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted">Shop</p>
                <Link to="/shop" onClick={closeMobile} className="py-1.5 text-ink-soft">
                  All resources
                </Link>
                <Link to="/grades" onClick={closeMobile} className="py-1.5 text-ink-soft">
                  Grades
                </Link>
                <Link to="/bundles" onClick={closeMobile} className="py-1.5 text-ink-soft">
                  Bundles &amp; access plans
                </Link>

                {plans.length > 0 ? (
                  <>
                    <p className="mt-3 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted">Access plans</p>
                    <div className="grid gap-3">
                      {plans.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} onClose={closeMobile} compact />
                      ))}
                    </div>
                  </>
                ) : null}

                <div className="my-4 h-px bg-line" />
                <NavLink to="/about" onClick={closeMobile} className="py-2 text-[1.05rem]">
                  About
                </NavLink>
                <NavLink to="/contact" onClick={closeMobile} className="py-2 text-[1.05rem]">
                  Contact
                </NavLink>
                <NavLink to="/help" onClick={closeMobile} className="py-2 text-[1.05rem]">
                  Help
                </NavLink>

                <div className="my-4 h-px bg-line" />
                <Link to="/cart" onClick={closeMobile} className="py-2 text-[1.05rem]">
                  Cart (0)
                </Link>
                <MobileAccountLink onNavigate={closeMobile} />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </Container>

      {megaOpen ? <ShopMega plans={plans} onClose={closeMega} panelRef={panelRef} /> : null}
    </header>
  )
}

function MobileAccountLink({ onNavigate }: { onNavigate: () => void }) {
  const { customer } = useAuth()
  return (
    <Link to={customer ? '/account' : '/login'} onClick={onNavigate} className="py-2 text-[1.05rem]">
      {customer ? `Account · ${customer.name.split(' ')[0]}` : 'Account / Log in'}
    </Link>
  )
}
