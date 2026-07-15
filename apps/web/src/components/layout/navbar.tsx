import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { bundleTiers, priceLabel, type BundleTier, type CmsSnapshot } from '@designing-minds/cms'
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
        New — CAPS resources for Grades 3–7 are here
        <Icon name="arrow" size={16} />
      </Container>
    </Link>
  )
}

function AccountControls({ onNavigate }: { onNavigate?: () => void }) {
  const { customer } = useAuth()
  const cartCount = useCartSlugs().length
  const cartLabel = `Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`

  return (
    <>
      <Link
        to="/cart"
        onClick={onNavigate}
        aria-label={cartLabel}
        className="inline-flex items-center gap-2 rounded-pill px-3 py-2 text-body-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
      >
        <span className="relative inline-flex">
          <Icon name="cart" size={16} />
          {cartCount > 0 ? (
            <span className="absolute -right-2.5 -top-2.5 grid min-h-4 min-w-4 place-items-center rounded-pill bg-primary px-1 text-[0.625rem] font-extrabold leading-none text-on-primary ring-2 ring-canvas">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          ) : null}
        </span>
        <span className="hidden sm:inline">Cart</span>
      </Link>

      {customer ? (
        <Link
          to="/account"
          onClick={onNavigate}
          aria-label={`${customer.name} — Customer account`}
          className="flex items-center gap-2 rounded-pill py-1 px-1 text-body-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
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
          aria-label="Log in to your account"
          className="inline-flex items-center gap-2 rounded-pill px-3 py-2 text-body-sm font-semibold text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
        >
          <Icon name="user" size={16} />
        </Link>
      )}
    </>
  )
}

/** Bundle tier card used in the mega menu (and reused in the mobile sheet). The
 *  featured (full-year) tier gets the pink-gradient island treatment from the
 *  homepage — a white island over the brand gradient and decorative texture;
 *  the term tier stays a plain light card. */
function BundleTierCard({ tier, onClose, compact }: { tier: BundleTier; onClose: () => void; compact?: boolean }) {
  const offer = tier.scope === 'Full Year' ? 'Full-year bundles' : 'Term bundles'
  const to = `/packages?offer=${encodeURIComponent(offer)}`

  if (tier.featured) {
    return (
      <Link
        to={to}
        onClick={onClose}
        className={`group relative isolate flex flex-col overflow-hidden rounded-card p-1.5 [background-image:var(--gradient-primary)] ${
          compact ? '' : 'h-full'
        }`}
      >
        <div className="absolute inset-0 -z-1 mix-blend-soft-light" aria-hidden>
          <img src="/images/card-background-02.svg" alt="" className="h-full w-full object-cover opacity-50" />
        </div>

        {/* White island holding the offer. */}
        <div className="flex flex-col gap-2 rounded-[0.55rem] bg-canvas p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption font-bold uppercase tracking-[0.12em] text-muted">Full year</span>
            <span className="rounded-pill bg-primary-tint px-2 py-0.5 text-[0.64rem] font-bold uppercase tracking-[0.06em] text-primary">
              Best value
            </span>
          </div>
          <div>
            <span className="block font-bold text-ink">{tier.title}</span>
            {compact ? null : (
              <span className="mt-0.5 block text-label text-muted">Choose from {tier.gradeCount} grades.</span>
            )}
          </div>
        </div>

        {/* Price and CTA on the gradient. */}
        <div className="mt-auto flex items-end justify-between gap-2 px-4 pb-2 pt-3 text-on-primary">
          <span className="flex items-baseline gap-1">
            <span className="text-label font-semibold text-on-primary/80">from</span>
            <span className="text-[1.5rem] font-extrabold leading-none tracking-[-0.02em]">
              {priceLabel(tier.fromPriceZar)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-label font-bold">
            Choose
            <span className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
              <Icon name="arrow" />
            </span>
          </span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      onClick={onClose}
      className={`group flex flex-col gap-3 rounded-card border border-line bg-surface p-5 transition-colors hover:border-primary ${
        compact ? '' : 'h-full'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption font-bold uppercase tracking-[0.12em] text-muted">One term</span>
      </div>

      <div>
        <span className="block font-bold text-ink">{tier.title}</span>
        {compact ? null : (
          <span className="mt-0.5 block text-label text-muted">
            Choose from {tier.gradeCount} grades, any term.
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

function ShopMega({ tiers, onClose, panelRef }: { tiers: BundleTier[]; onClose: () => void; panelRef: RefObject<HTMLDivElement | null> }) {
  return (
    <>
      {/* Visual dim only — outside clicks are handled by a document listener. */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 bg-ink/10" />
      <div ref={panelRef} className="absolute inset-x-0 top-full z-40 hidden border-t border-line bg-surface shadow-card lg:block">
        <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_1.7fr]">
          {/* Links */}
          <div>
            <p className="mb-3 text-label font-semibold uppercase tracking-[0.1em] text-muted">Browse</p>
            <ul className="-mx-3 grid gap-1">
              <MegaLink to="/shop" onClose={onClose} icon="doc" label="All resources" sub="The full catalogue" />
              <MegaLink to="/grades" onClose={onClose} icon="book" label="Grades" sub="Browse Grades 3–7" />
              <MegaLink to="/packages" onClose={onClose} icon="spark" label="Bundles" sub="Save with term or full-year bundles" />
            </ul>
          </div>

          {/* Bundle tiers */}
          <div>
            <p className="mb-4 text-label font-semibold uppercase tracking-[0.1em] text-muted">Bundles</p>
            {tiers.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {tiers.map((tier) => (
                  <BundleTierCard key={tier.scope} tier={tier} onClose={onClose} />
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-muted">No bundles published yet.</p>
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
  const tiers = snapshot ? bundleTiers(snapshot) : []
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

  // While the mobile menu is open: lock the page behind it and close on Escape.
  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileOpen])

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

          {/* Mobile menu toggle — the panel itself drops down below the header
              (see MobileMenu), so the bar stays visible while it is open. */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            className="grid h-10 w-10 place-items-center rounded-pill hover:bg-surface-sunk lg:hidden"
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size={20} />
          </button>
        </div>
      </Container>

      {megaOpen ? <ShopMega tiers={tiers} onClose={closeMega} panelRef={panelRef} /> : null}
      <MobileMenu open={mobileOpen} onClose={closeMobile} tiers={tiers} />
      </header>
    </>
  )
}

/** Mobile navigation. A full-width panel that unrolls downward from the header
 *  and rolls back up on close, so the bar (logo, cart, account) stays visible
 *  above it — those controls are intentionally not repeated inside. Shop sits
 *  behind a click-to-open accordion, echoing the desktop mega menu. */
function MobileMenu({ open, onClose, tiers }: { open: boolean; onClose: () => void; tiers: BundleTier[] }) {
  const [shopOpen, setShopOpen] = useState(false)
  // NavLink takes a className function; `divider` adds the row's bottom hairline.
  const linkCls = (divider: boolean) => ({ isActive }: { isActive: boolean }) =>
    `${divider ? 'border-b border-line ' : ''}py-4 text-body-lg font-semibold transition-colors ${
      isActive ? 'text-primary' : 'text-ink'
    }`

  return (
    <div
      id="mobile-menu"
      aria-hidden={!open}
      className={`absolute inset-x-0 top-full z-30 h-[calc(100dvh-var(--header-h))] overflow-hidden lg:hidden ${
        open ? '' : 'pointer-events-none'
      }`}
    >
      <div
        className={`h-full overflow-y-auto bg-surface shadow-lift transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <Container className="flex flex-col pb-16">
          <NavLink to="/" end onClick={onClose} className={linkCls(true)}>
            Home
          </NavLink>

          {/* Shop — click to expand, mirroring the desktop mega menu. */}
          <div className="border-b border-line">
            <button
              type="button"
              onClick={() => setShopOpen((value) => !value)}
              aria-expanded={shopOpen}
              aria-controls="mobile-shop-panel"
              className={`flex w-full items-center justify-between py-4 text-body-lg font-semibold transition-colors ${
                shopOpen ? 'text-primary' : 'text-ink'
              }`}
            >
              Shop
              <span className={`h-4 w-4 text-muted transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`}>
                <Icon name="chevron" />
              </span>
            </button>
            {shopOpen ? (
              <div id="mobile-shop-panel" className="flex animate-fade-up flex-col gap-1 pb-4">
                <Link to="/shop" onClick={onClose} className="rounded-control px-3 py-2 text-body text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink">
                  All resources
                </Link>
                <Link to="/grades" onClick={onClose} className="rounded-control px-3 py-2 text-body text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink">
                  Grades
                </Link>
                <Link to="/packages" onClick={onClose} className="rounded-control px-3 py-2 text-body text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink">
                  Bundles
                </Link>
                {tiers.length > 0 ? (
                  <div className="mt-3 grid gap-3">
                    {tiers.map((tier) => (
                      <BundleTierCard key={tier.scope} tier={tier} onClose={onClose} compact />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <NavLink to="/about" onClick={onClose} className={linkCls(true)}>
            About
          </NavLink>
          <NavLink to="/contact" onClick={onClose} className={linkCls(true)}>
            Contact
          </NavLink>
          <NavLink to="/help" onClick={onClose} className={linkCls(false)}>
            Help
          </NavLink>
        </Container>
      </div>
    </div>
  )
}
