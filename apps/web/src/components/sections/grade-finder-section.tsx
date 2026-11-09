import { type CmsSnapshot } from '@designing-minds/cms'
import { GradeCard } from '../ui/grade-card'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Section, SectionNotice } from '../ui/section'
import { productsForGrade } from '../../lib/products'

export function GradeFinderSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  if (!snapshot) {
    return (
      <Section id="explore-resources">
        <SectionNotice
          title={loadError ? 'Grades are unavailable' : 'Loading grades...'}
          body={loadError ?? 'Grade resources will appear when the catalogue finishes loading.'}
        />
      </Section>
    )
  }

  const grades = snapshot.valueLists.grades
  return (
    <Section id="explore-resources">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 lg:mb-10">
        <div className="max-w-xl">
          <h2>Explore our resources</h2>
          <p className="lead mt-4 max-w-[46ch]">
            CAPS-aligned tests, memos and summaries for Grades 3 to 7 — browse by grade, or explore all resources.
          </p>
        </div>
        <Button to="/shop" variant="text" className="px-0">Browse all resources <Icon name="arrow" size={16} /></Button>
      </div>

      <div className="grade-grid grade-grid--compact">
        {grades.map((grade) => (
          <GradeCard key={grade} grade={grade} count={productsForGrade(snapshot, grade).length} compact />
        ))}
      </div>
    </Section>
  )
}
