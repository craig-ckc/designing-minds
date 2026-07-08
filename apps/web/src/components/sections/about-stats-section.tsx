import { type CmsSnapshot } from '@designing-minds/cms'
import { Section } from '../ui/section'
import { StatsRow } from './stats-row'

export function AboutStatsSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  return (
    <Section className="bg-cream" spacing="tight">
      <StatsRow
        stats={[
          { value: '500+', label: 'Families helped' },
          { value: snapshot ? String(snapshot.stats.gradeCount) : '5', label: 'Grades supported' },
          { value: snapshot ? String(snapshot.stats.productCount) : '...', label: 'Resources created' },
          { value: '100%', label: 'CAPS aligned' },
        ]}
      />
    </Section>
  )
}

