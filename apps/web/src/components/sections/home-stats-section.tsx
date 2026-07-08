import { type CmsSnapshot } from '@designing-minds/cms'
import { Section } from '../ui/section'
import { StatsRow } from './stats-row'
import fallbackGrades from '../../content/home/fallback-grades.json'

export function HomeStatsSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const stats = snapshot
    ? [
        { value: String(snapshot.stats.gradeCount), label: 'Grades supported' },
        { value: '70+', label: 'Families helped' },
        { value: String(snapshot.stats.productCount), label: 'Resources & bundles' },
        { value: String(snapshot.stats.subjectCount), label: 'Subjects covered' },
      ]
    : [
        { value: String(fallbackGrades.length), label: 'Grades supported' },
        { value: '70+', label: 'Families helped' },
        { value: '...', label: 'Resources & bundles' },
        { value: '...', label: 'Subjects covered' },
      ]

  return (
    <Section spacing="tight">
      <p className="mb-8 text-center text-body font-medium text-muted">
        Trusted by families across South Africa
      </p>
      <StatsRow stats={stats} />
    </Section>
  )
}
