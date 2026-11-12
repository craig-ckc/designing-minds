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
  { value: '5', label: 'Grades currently supported', icon: 'book' },
]

/**
 * The single trust-stats band. Each stat is a white circle holding the
 * accent-coloured icon, sitting on a hairline that runs through the row, with a
 * big number and a muted label underneath. Only the caption is page-specific.
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
      <div className="relative mx-auto">
        {/* Hairline threaded through the icon chips (single row from md up). */}
        <span aria-hidden className="absolute inset-x-8 top-8 hidden h-px bg-line md:block" />
        <div className="relative grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-line bg-surface text-primary shadow-cover">
                <Icon name={stat.icon} size={30} />
              </span>
              <strong className="mt-5 block text-display text-primary">{stat.value}</strong>
              <span className="mt-1 text-body font-medium text-muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
