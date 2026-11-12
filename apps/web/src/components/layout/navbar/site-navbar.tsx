import { useRef } from 'react'
import { bundleTiers, type CmsSnapshot } from '@designing-minds/cms'
import { Container } from '../../ui/container'
import { Wordmark } from '../../ui/wordmark'
import { AccountActions } from './account-actions'
import { AnnouncementBar } from './announcement-bar'
import { CatalogSearch } from './catalog-search'
import { DesktopNav } from './desktop-nav'
import { MobileMenu } from './mobile-menu'

/** Site header: promo bar, then the sticky bar with the wordmark, desktop nav
 *  (mega menu), search, cart/account and the mobile menu toggle. Composition
 *  only — each part owns its own behaviour. */
export function Navbar({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const headerRef = useRef<HTMLElement>(null)
  const tiers = snapshot ? bundleTiers(snapshot) : []

  return (
    <>
      <AnnouncementBar />
      <header ref={headerRef} className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
        <Container className="flex min-h-[var(--header-h)] items-center gap-3 xl:gap-8">
          <Wordmark />
          <DesktopNav tiers={tiers} anchorRef={headerRef} />
          <CatalogSearch className="ml-auto hidden w-40 lg:flex xl:w-64" />
          <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:ml-0">
            <AccountActions />
            <MobileMenu tiers={tiers} anchorRef={headerRef} />
          </div>
        </Container>
      </header>
    </>
  )
}
