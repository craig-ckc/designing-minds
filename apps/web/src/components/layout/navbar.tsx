import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Dialog } from '@base-ui/react/dialog'
import { accessPlanTiers, priceLabel, type AccessPlanTier, type CmsSnapshot } from '@designing-minds/cms'
import { Container } from '../ui/container'
import { Icon, type IconName } from '../ui/icon'
import { Wordmark } from '../ui/wordmark'
import { initials, useAuth } from '../../lib/auth'
import { useCartSlugs } from '../../lib/use-cart'

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-body font-semibold transition-colors ${
    isActive ? 'text-primary' : 'text-ink-soft hover:text-ink'
  }`

/** Full-width promo bar above the nav; scrolls away as the sticky header pins. */
function AnnouncementBar() {
  return (
    <Link to="/shop" className="block bg-primary text-on-primary transition-colors hover:bg-primary-strong">
      <Container className="flex items-center justify-center gap-2 py-2.5 text-center text-label font-semibold">
        New — Term 4 CAPS resources for Grades 3–7 are here
        <Icon name="arrow" size={16} />
      </Container>
    </Link>
  )
}

function AccountControls({ onNavigate }: { onNavigate?: () => void }) {
  const { customer } = useAuth()
  const cartCount = useCartSlugs().length

  return (
    <>
      <Link
        to="/cart"
        onClick={onNavigate}
        className="inline-flex items-center gap-2 rounded-pill px-3 py-2 text-body-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
      >
        <Icon name="cart" size={16} />
        <span className="hidden sm:inline">Cart ({cartCount})</span>
      </Link>

      {customer ? (
        <Link
          to="/account"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-pill py-1 pl-1 pr-3 text-body-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
          title={`${customer.name} — Customer Account`}
        >
          <span className="grid h-8 w-8 flex-none place-items-center rounded-pill bg-primary text-caption font-bold tracking-[0.02em] text-on-primary">
            {initials(customer.name)}
          </span>
        </Link>
      ) : (
        <Link
          to="/login"
          onClick={onNavigate}
          className="inline-flex items-center gap-2 rounded-pill px-3 py-2 text-body-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
        >
          <Icon name="user" size={16} />
        </Link>
      )}
    </>
  )
}

/** Access-plan tier card used in the mega menu (and reused in the mobile sheet).
 *  Each tier deep-links into /packages, where the buyer picks a fixed-grade plan. */
function PlanTierCard({ tier, onClose, compact }: { tier: AccessPlanTier; onClose: () => void; compact?: boolean }) {
  return (
    <Link
      to={`/packages?plan=${tier.tier}`}
      onClick={onClose}
      className={`group flex flex-col gap-3 rounded-card border p-5 transition-colors hover:border-primary ${
        tier.featured ? 'border-primary bg-primary-tint/40' : 'border-line bg-surface'
      } ${compact ? '' : 'h-full'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption font-bold uppercase tracking-[0.12em] text-muted">
          {tier.period === 'Year' ? 'Full year' : 'One term'}
        </span>
        {tier.featured ? (
          <span className="rounded-pill bg-primary px-2 py-0.5 text-[0.64rem] font-bold uppercase tracking-[0.06em] text-on-primary">
            Best value
          </span>
        ) : null}
      </div>

      <div>
        <span className="block font-bold text-ink">{tier.title}</span>
        {compact ? null : (
          <span className="mt-0.5 block text-label text-muted">
            Choose from {tier.gradeCount} grades{tier.period === 'Term' ? ', any term' : ''}.
          </span>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 pt-1">
        <span className="flex items-baseline gap-1">
          <span className="text-label font-semibold text-muted">from</span>
          <span className="text-[1.5rem] font-extrabold leading-none tracking-[-0.02em] text-primary">
            {priceLabel(tier.fromPriceZar)}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-label font-bold text-primary">
          Choose
          <span className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
            <Icon name="arrow" />
          </span>
        </span>
      </div>
    </Link>
  )
}

function ShopMega({ tiers, onClose, panelRef }: { tiers: AccessPlanTier[]; onClose: () => void; panelRef: RefObject<HTMLDivElement | null> }) {
  return (
    <>
      {/* Visual dim only — outside clicks are handled by a document listener. */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 bg-ink/10" />
      <div ref={panelRef} className="absolute inset-x-0 top-full z-40 hidden border-t border-line bg-surface shadow-card lg:block">
        <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_1.7fr]">
          {/* Links */}
          <div>
            <h5 className="mb-3 text-label font-semibold uppercase tracking-[0.1em] text-muted">Browse</h5>
            <ul className="-mx-3 grid gap-1">
              <MegaLink to="/shop" onClose={onClose} icon="doc" label="All resources" sub="The full catalogue" />
              <MegaLink to="/grades" onClose={onClose} icon="book" label="Grades" sub="Browse Grades 3–7" />
              <MegaLink to="/packages" onClose={onClose} icon="spark" label="Bundles & access plans" sub="Save with bundles" />
            </ul>
          </div>

          {/* Access plan tiers */}
          <div>
            <h5 className="mb-4 text-label font-semibold uppercase tracking-[0.1em] text-muted">Access plans</h5>
            {tiers.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {tiers.map((tier) => (
                  <PlanTierCard key={tier.tier} tier={tier} onClose={onClose} />
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-muted">No access plans published yet.</p>
            )}
          </div>
        </Container>
      </div>
    </>
  )
}

function MegaLink({ to, label, sub, icon, onClose }: { to: string; label: string; sub: string; icon: IconName; onClose: () => void }) {
  return (
    <li>
      <Link to={to} onClick={onClose} className="group flex items-start gap-3 rounded-control p-3 transition-colors hover:bg-surface-alt">
        <span className="mt-0.5 h-5 w-5 flex-none text-primary">
          <Icon name={icon} />
        </span>
        <span>
          <span className="block font-semibold text-ink transition-colors group-hover:text-primary">{label}</span>
          <span className="block text-label text-muted">{sub}</span>
        </span>
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
  const cartCount = useCartSlugs().length
  const tiers = snapshot ? accessPlanTiers(snapshot) : []
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
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <Container className="flex min-h-[var(--header-h)] items-center gap-7">
        <Wordmark onClick={closeMega} />

        <nav className="ml-3 hidden items-center gap-1 lg:flex">
          <NavLink to="/" end onClick={closeMega} className={navLinkCls}>
            Home
          </NavLink>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMegaOpen((open) => !open)}
            aria-expanded={megaOpen}
            className={`flex items-center gap-1.5 px-3 py-2 text-body font-semibold transition-colors ${
              megaOpen ? 'text-primary' : 'text-ink-soft hover:text-ink'
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

        <div className="ml-auto flex items-center gap-2">
          <AccountControls onNavigate={closeMega} />

          {/* Mobile menu */}
          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger className="grid h-10 w-10 place-items-center rounded-pill hover:bg-surface-sunk lg:hidden">
              <Icon name="menu" size={20} />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm" />
              <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-[84%] max-w-sm flex-col gap-1 overflow-y-auto rounded-l-3xl bg-surface p-6 shadow-lift">
                <div className="mb-4 flex items-center justify-between">
                  <Dialog.Title className="text-label font-semibold uppercase tracking-[0.12em] text-muted">
                    Menu
                  </Dialog.Title>
                  <Dialog.Close className="grid h-9 w-9 place-items-center rounded-pill hover:bg-surface-sunk">
                    <Icon name="close" size={20} />
                  </Dialog.Close>
                </div>

                <NavLink to="/" end onClick={closeMobile} className="py-2 text-body-lg">
                  Home
                </NavLink>
                <p className="mt-3 text-label font-semibold uppercase tracking-[0.1em] text-muted">Shop</p>
                <Link to="/shop" onClick={closeMobile} className="py-1.5 text-ink-soft">
                  All resources
                </Link>
                <Link to="/grades" onClick={closeMobile} className="py-1.5 text-ink-soft">
                  Grades
                </Link>
                <Link to="/packages" onClick={closeMobile} className="py-1.5 text-ink-soft">
                  Bundles &amp; access plans
                </Link>

                {tiers.length > 0 ? (
                  <>
                    <p className="mt-3 text-label font-semibold uppercase tracking-[0.1em] text-muted">Access plans</p>
                    <div className="grid gap-3">
                      {tiers.map((tier) => (
                        <PlanTierCard key={tier.tier} tier={tier} onClose={closeMobile} compact />
                      ))}
                    </div>
                  </>
                ) : null}

                <div className="my-4 h-px bg-line" />
                <NavLink to="/about" onClick={closeMobile} className="py-2 text-body-lg">
                  About
                </NavLink>
                <NavLink to="/contact" onClick={closeMobile} className="py-2 text-body-lg">
                  Contact
                </NavLink>
                <NavLink to="/help" onClick={closeMobile} className="py-2 text-body-lg">
                  Help
                </NavLink>

                <div className="my-4 h-px bg-line" />
                <Link to="/cart" onClick={closeMobile} className="py-2 text-body-lg">
                  Cart ({cartCount})
                </Link>
                <MobileAccountLink onNavigate={closeMobile} />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </Container>

      {megaOpen ? <ShopMega tiers={tiers} onClose={closeMega} panelRef={panelRef} /> : null}
      </header>
    </>
  )
}

function MobileAccountLink({ onNavigate }: { onNavigate: () => void }) {
  const { customer } = useAuth()
  return (
    <Link to={customer ? '/account' : '/login'} onClick={onNavigate} className="py-2 text-body-lg">
      {customer ? `Account · ${customer.name.split(' ')[0]}` : 'Account / Log in'}
    </Link>
  )
}
