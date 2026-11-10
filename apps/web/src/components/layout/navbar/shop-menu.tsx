import { Link } from 'react-router-dom'
import { NavigationMenu } from '@base-ui/react/navigation-menu'
import type { BundleTier } from '@designing-minds/cms'
import { Container } from '../../ui/container'
import { Icon, type IconName } from '../../ui/icon'
import { shopBrowseLinks } from './shop-links'
import { BundleTierCard } from './bundle-tier-card'
import { tierDescription } from './tier-links'

function MegaLink({ to, label, sub, icon, onNavigate }: { to: string; label: string; sub: string; icon: IconName; onNavigate: () => void }) {
  return (
    <li>
      <NavigationMenu.Link
        render={<Link to={to} onClick={onNavigate} />}
        className="group flex items-start gap-3 rounded-control p-3 transition-colors hover:bg-surface-alt"
      >
        <span className="mt-0.5 h-5 w-5 flex-none text-primary">
          <Icon name={icon} />
        </span>
        <span>
          <span className="block font-semibold text-ink transition-colors group-hover:text-primary-ink">{label}</span>
          <span className="block text-label text-muted">{sub}</span>
        </span>
      </NavigationMenu.Link>
    </li>
  )
}

/** Desktop Shop mega-menu panel: browse links beside the published bundle tiers. */
export function ShopMenuContent({ tiers, onNavigate }: { tiers: BundleTier[]; onNavigate: () => void }) {
  return (
    <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_1.7fr]">
      <div>
        <p className="mb-3 text-label font-semibold uppercase tracking-[0.1em] text-muted">Browse</p>
        <ul className="-mx-3 grid gap-1">
          {shopBrowseLinks.map((link) => (
            <MegaLink key={link.to} {...link} onNavigate={onNavigate} />
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-4 text-label font-semibold uppercase tracking-[0.1em] text-muted">Bundles</p>
        {tiers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {tiers.map((tier) => (
              <BundleTierCard key={tier.scope} tier={tier} onNavigate={onNavigate} className="h-full">
                {tierDescription(tier)}
              </BundleTierCard>
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-muted">No bundles published yet.</p>
        )}
      </div>
    </Container>
  )
}
