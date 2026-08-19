import { type ReactNode } from 'react'
import { StatsSection, type Stat } from './stats-section'

/**
 * The shared trust-stats band used on both the home and about pages. The stat
 * items live here once so the two pages stay in sync; only the caption is
 * page-specific.
 *
 * These are curated brand figures (Amy's catalogue feedback), not derived from
 * the live catalogue — the public snapshot never carries customer counts, and
 * the headline numbers are marketing claims that should read the same on every
 * page regardless of what is currently published.
 */
const HOMEPAGE_STATS: Stat[] = [
  { value: '750+', label: 'Customers', icon: 'user' },
  { value: '360', label: 'Resources', icon: 'doc' },
  { value: '11', label: 'Subjects covered', icon: 'palette' },
  { value: '5', label: 'Grades currently supported', icon: 'book' },
]

export function TrustStatsSection({
  caption = 'Practice resources designed for South African learners',
}: {
  caption?: ReactNode
}) {
  return <StatsSection stats={HOMEPAGE_STATS} caption={caption} />
}
