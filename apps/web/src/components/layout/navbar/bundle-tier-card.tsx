import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@designing-minds/utils'
import { priceLabel, type BundleTier } from '@designing-minds/cms'
import { ArrowAffordance } from '../../ui/icon'
import { tierHref } from './tier-links'

type TierCardProps = {
  tier: BundleTier
  onNavigate: () => void
  className?: string
  /** Optional description line under the title. */
  children?: ReactNode
}

function TierDescription({ children }: { children?: ReactNode }) {
  return children ? <span className="mt-0.5 block text-label text-muted">{children}</span> : null
}

/** Featured (full-year) tier: a white island over the brand gradient and its
 *  decorative texture, with price and CTA sitting on the gradient. */
export function FeaturedTierCard({ tier, onNavigate, className, children }: TierCardProps) {
  return (
    <Link
      to={tierHref(tier)}
      onClick={onNavigate}
      className={cn(
        'group relative isolate flex flex-col overflow-hidden rounded-md p-2 [background-image:var(--gradient-primary)]',
        className,
      )}
    >
      <div
        className="absolute inset-0 -z-1 bg-cover bg-center opacity-50 mix-blend-soft-light"
        style={{ backgroundImage: "url('/images/card-background-02.svg')" }}
        aria-hidden
      />

      {/* White island holding the offer; radius is concentric with the card. */}
      <div className="flex flex-col gap-2 rounded-[calc(var(--radius-md)-0.375rem)] bg-canvas p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-caption font-bold uppercase tracking-[0.12em] text-muted">Full year</span>
          <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[0.64rem] font-bold uppercase tracking-[0.06em] text-primary-ink">
            Best value
          </span>
        </div>
        <div>
          <span className="block font-bold text-ink">{tier.title}</span>
          <TierDescription>{children}</TierDescription>
        </div>
      </div>

      {/* Price and CTA on the gradient. */}
      <div className="mt-auto flex items-end justify-between gap-2 px-4 pb-2 pt-3 text-on-primary">
        <TierPrice tier={tier} />
        <TierCta />
      </div>
    </Link>
  )
}

/** Term tier: a plain light card. */
export function TermTierCard({ tier, onNavigate, className, children }: TierCardProps) {
  return (
    <Link
      to={tierHref(tier)}
      onClick={onNavigate}
      className={cn(
        'group flex flex-col gap-3 rounded-md border border-line bg-surface p-5 transition-colors hover:border-primary',
        className,
      )}
    >
      <span className="text-caption font-bold uppercase tracking-[0.12em] text-muted">One term</span>

      <div>
        <span className="block font-bold text-ink">{tier.title}</span>
        <TierDescription>{children}</TierDescription>
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 pt-1">
        <TierPrice tier={tier} tone="accent" />
        <TierCta tone="accent" />
      </div>
    </Link>
  )
}

/** Picks the explicit variant for a tier. */
export function BundleTierCard(props: TierCardProps) {
  return props.tier.featured ? <FeaturedTierCard {...props} /> : <TermTierCard {...props} />
}

function TierPrice({ tier, tone = 'inherit' }: { tier: BundleTier; tone?: 'inherit' | 'accent' }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className={cn('text-label font-semibold', tone === 'accent' ? 'text-muted' : 'text-on-primary')}>from</span>
      <span
        className={cn(
          'text-[1.5rem] font-extrabold leading-none tracking-[-0.02em]',
          tone === 'accent' && 'text-primary',
        )}
      >
        {priceLabel(tier.fromPriceZar)}
      </span>
    </span>
  )
}

function TierCta({ tone = 'inherit' }: { tone?: 'inherit' | 'accent' }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-label font-bold', tone === 'accent' && 'text-primary-ink')}>
      Choose
      <ArrowAffordance />
    </span>
  )
}
