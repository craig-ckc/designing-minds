import { type ReactNode } from 'react'
import { type CmsSnapshot } from '@designing-minds/cms'
import { StatsSection, type Stat } from './stats-section'

/**
 * The shared trust-stats band used on both the home and about pages. The stat
 * items live here once so the two pages stay in sync; only the caption is
 * page-specific.
 */
export function TrustStatsSection({
  snapshot,
  caption = 'Practice resources designed for South African learners',
}: {
  snapshot: CmsSnapshot | null
  caption?: ReactNode
}) {
  const stats: Stat[] = [
    { value: snapshot ? String(snapshot.stats.gradeCount) : '...', label: 'Grades supported', icon: 'book' },
    { value: '500+', label: 'Families helped', icon: 'smile' },
    { value: snapshot ? String(snapshot.stats.productCount) : '...', label: 'Resources & bundles', icon: 'doc' },
    { value: snapshot ? String(snapshot.stats.subjectCount) : '...', label: 'Subjects covered', icon: 'palette' },
  ]

  return <StatsSection stats={stats} caption={caption} />
}
