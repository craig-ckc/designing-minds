import { type ReactNode } from 'react'
import { SOCIAL_PROOF } from '../../content/site'
import { Icon, type IconName } from '../ui/icon'
import { Section } from '../ui/section'

export type Stat = { value: string; label: string; icon: IconName }

/**
 * Curated brand figures (Amy's catalogue feedback), not derived from the live
 * catalogue: the public snapshot never carries customer counts, and these
 * marketing claims should read the same on every page. The customer count comes
 * from SOCIAL_PROOF so this band and the hero claim can never disagree.
 */
const BRAND_STATS: Stat[] = [
  { value: SOCIAL_PROOF.customers, label: 'Customers', icon: 'user' },
  { value: '360', label: 'Resources', icon: 'doc' },
  { value: '11', label: 'Subjects covered', icon: 'palette' },
  { value: '5', label: 'Grades supported', icon: 'book' },
]

/**
 * The single trust-stats band (Figma `StatItem`). Each stat is a white circle holding the
 * accent-coloured icon beside a big number over a muted label; on desktop the four sit in one
 * centred row split by hairline dividers. Phones stack each stat in a two-up grid. Only the
 * caption is page-specific.
 */
export function StatsSection({
  stats = BRAND_STATS,
  caption,
  className,
  spacing = 'tight',
}: {
  stats?: Stat[]
  caption?: ReactNode
  className?: string
  spacing?: 'default' | 'tight'
}) {
  return (
    <Section className={className} spacing={spacing}>
      {caption ? <p className="mb-12 text-center text-body font-medium text-muted">{caption}</p> : null}
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:flex lg:justify-center lg:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center text-center lg:max-w-[280px] lg:flex-row lg:items-start lg:gap-4 lg:border-line lg:px-6 lg:text-left lg:not-first:border-l"
          >
            <span className="grid h-16 w-16 flex-none place-items-center rounded-full border border-line bg-surface text-primary shadow-cover">
              <Icon name={stat.icon} size={30} />
            </span>
            <span className="mt-5 flex flex-col lg:mt-0 lg:pt-1">
              <strong className="block text-display text-primary">{stat.value}</strong>
              <span className="mt-1 text-body font-medium text-muted lg:mt-0">{stat.label}</span>
            </span>
          </div>
        ))}
      </div>
    </Section>
  )
}
