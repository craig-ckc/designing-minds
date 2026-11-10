import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { NavigationMenu } from '@base-ui/react/navigation-menu'
import { cn } from '@designing-minds/utils'
import type { BundleTier } from '@designing-minds/cms'
import { Icon } from '../../ui/icon'
import { navLinkStyles } from './nav-styles'
import { ShopMenuContent } from './shop-menu'

const SHOP = 'shop'

function BarLink({ to, end, children, onNavigate }: { to: string; end?: boolean; children: string; onNavigate: () => void }) {
  return (
    <NavigationMenu.Item>
      <NavigationMenu.Link
        render={<NavLink to={to} end={end} onClick={onNavigate} className={({ isActive }) => navLinkStyles({ level: 'bar', active: isActive })} />}
      >
        {children}
      </NavigationMenu.Link>
    </NavigationMenu.Item>
  )
}

/** Desktop navigation (lg+) on Base UI NavigationMenu: the Shop trigger opens a
 *  full-width mega panel anchored under the header. Keyboard open, focus
 *  hand-off, Escape-to-close with focus return, aria wiring and outside-press
 *  dismissal all come from the primitive.
 *
 *  The open value is keyed to the pathname, so a route change closes the panel
 *  by derivation (no effect). `anchorRef` is the header the panel hangs from. */
export function DesktopNav({ tiers, anchorRef }: { tiers: BundleTier[]; anchorRef: React.RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState<{ value: string | null; pathname: string }>({ value: null, pathname })
  const value = open.pathname === pathname ? open.value : null
  const close = () => setOpen({ value: null, pathname })

  return (
    <NavigationMenu.Root
      value={value}
      onValueChange={(next) => setOpen({ value: next, pathname })}
      aria-label="Main"
      className="ml-3 hidden lg:flex"
    >
      <NavigationMenu.List className="flex items-center gap-1">
        <BarLink to="/" end onNavigate={close}>Home</BarLink>

        <NavigationMenu.Item value={SHOP}>
          <NavigationMenu.Trigger
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-body font-semibold text-ink-soft transition-colors hover:text-ink',
              'data-[popup-open]:text-primary-ink',
            )}
          >
            Shop
            <NavigationMenu.Icon className="h-3.5 w-3.5 transition-transform data-[popup-open]:rotate-180">
              <Icon name="chevron" />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            <ShopMenuContent tiers={tiers} onNavigate={close} />
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <BarLink to="/about" onNavigate={close}>About</BarLink>
        <BarLink to="/contact" onNavigate={close}>Contact</BarLink>
        <BarLink to="/help" onNavigate={close}>Help</BarLink>
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        {/* Visual dim below the header; the primitive handles outside presses. */}
        <NavigationMenu.Backdrop className="pointer-events-none fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 bg-ink/10 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <NavigationMenu.Positioner
          anchor={anchorRef}
          side="bottom"
          align="start"
          positionMethod="fixed"
          collisionAvoidance={{ side: 'none', align: 'none' }}
          className="z-40 left-0! w-screen! max-w-none!"
        >
          <NavigationMenu.Popup
            className="w-full border-t border-line bg-surface outline-none"
          >
            <NavigationMenu.Viewport className="relative w-full" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  )
}
