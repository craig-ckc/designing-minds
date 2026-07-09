import { type ReactNode } from 'react'
import { Icon, type IconName } from '../ui/icon'
import { Section } from '../ui/section'

export type Stat = { value: string; label: string; icon: IconName }

/**
 * The single trust-stats band, shared by the home and about pages. Each stat is
 * a white circle holding the accent-coloured icon, sitting on a hairline that
 * runs through the row — a big number and a muted label underneath.
 */
export function StatsSection({
  stats,
  caption,
  className,
  spacing = 'tight',
}: {
  stats: Stat[]
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
              <span className="grid h-16 w-16 place-items-center rounded-pill border border-line bg-surface text-primary shadow-cover">
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
