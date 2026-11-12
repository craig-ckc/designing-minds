import { useRef, useState, type RefObject } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Collapsible } from '@base-ui/react/collapsible'
import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@designing-minds/utils'
import type { BundleTier } from '@designing-minds/cms'
import { Container } from '../../ui/container'
import { Icon } from '../../ui/icon'
import { BundleTierCard } from './bundle-tier-card'
import { CatalogSearch } from './catalog-search'
import { navLinkStyles } from './nav-styles'
import { shopBrowseLinks } from './shop-links'

const sheetLink = (divider: boolean) => ({ isActive }: { isActive: boolean }) =>
  navLinkStyles({ level: 'sheet', active: isActive, rule: divider ? 'below' : 'none' })

/** The sheet's contents. Kept separate from the Dialog so it can render (and be
 *  tested) without the portal. Shop sits behind a Collapsible, echoing the
 *  desktop mega menu; every link calls `onNavigate` to dismiss the sheet. */
export function MobileMenuContent({ tiers, onNavigate }: { tiers: BundleTier[]; onNavigate: () => void }) {
  return (
    <Container className="flex flex-col pb-16">
      <CatalogSearch className="my-4 flex" onSubmit={onNavigate} />
      <NavLink to="/" end onClick={onNavigate} className={sheetLink(true)}>
        Home
      </NavLink>

      <Collapsible.Root className="border-b border-line">
        <Collapsible.Trigger className="group/shop flex w-full items-center justify-between py-4 text-body-lg font-semibold text-ink transition-colors data-[panel-open]:text-primary-ink">
          Shop
          <span className="h-4 w-4 text-muted transition-transform duration-200 group-data-[panel-open]/shop:rotate-180">
            <Icon name="chevron" />
          </span>
        </Collapsible.Trigger>
        <Collapsible.Panel className="animate-fade-up">
          <div className="flex flex-col gap-1 pb-4">
            {shopBrowseLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={onNavigate}
                className="rounded-md px-3 py-2 text-body text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
            {tiers.length > 0 ? (
              <div className="mt-3 grid gap-3">
                {tiers.map((tier) => (
                  <BundleTierCard key={tier.scope} tier={tier} onNavigate={onNavigate} />
                ))}
              </div>
            ) : null}
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>

      <NavLink to="/about" onClick={onNavigate} className={sheetLink(true)}>
        About
      </NavLink>
      <NavLink to="/contact" onClick={onNavigate} className={sheetLink(true)}>
        Contact
      </NavLink>
      <NavLink to="/help" onClick={onNavigate} className={sheetLink(false)}>
        Help
      </NavLink>
    </Container>
  )
}

/** Mobile navigation (below lg): the header toggle plus a modal sheet that
 *  unrolls from under the header, so the bar stays visible above it. Built on
 *  Base UI Dialog — focus trap, Escape, scroll lock, inert siblings and focus
 *  return to the toggle come from the primitive. `anchorRef` is the header; the
 *  sheet starts at its bottom edge, measured when it opens (so the promo bar
 *  above it is accounted for). The open state is keyed to the pathname, so a
 *  route change closes the sheet by derivation. */
export function MobileMenu({ tiers, anchorRef }: { tiers: BundleTier[]; anchorRef: RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation()
  const [openAt, setOpenAt] = useState<string | null>(null)
  const [top, setTop] = useState(0)
  const popupRef = useRef<HTMLDivElement>(null)
  const open = openAt === pathname

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setTop(Math.max(0, anchorRef.current?.getBoundingClientRect().bottom ?? 0))
        setOpenAt(next ? pathname : null)
      }}
    >
      <Dialog.Trigger
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-sunk lg:hidden"
      >
        <Icon name={open ? 'close' : 'menu'} size={20} />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Viewport
          style={{ top }}
          className={cn('fixed inset-x-0 bottom-0 z-30 overflow-hidden lg:hidden')}
        >
          <Dialog.Popup
            ref={popupRef}
            // Focus the sheet itself, not the search field, so touch devices do not
            // pop the keyboard; the first Tab lands on the search field.
            initialFocus={popupRef}
            className="h-full overflow-y-auto bg-surface outline-none transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[ending-style]:-translate-y-full data-[starting-style]:-translate-y-full"
          >
            <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
            <MobileMenuContent tiers={tiers} onNavigate={() => setOpenAt(null)} />
            <Dialog.Close className="sr-only">Close navigation menu</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
