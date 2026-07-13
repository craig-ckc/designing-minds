import { type CmsSnapshot } from '@designing-minds/cms'
import { GradeCard } from '../ui/grade-card'
import { Section, SectionNotice } from '../ui/section'
import { productsForGrade } from '../../lib/products'

export function GradeFinderSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  if (!snapshot) {
    return (
      <Section>
        <SectionNotice
          title={loadError ? 'Grades are unavailable' : 'Loading grades...'}
          body={loadError ?? 'Grade resources will appear when the catalogue finishes loading.'}
        />
      </Section>
    )
  }

  const grades = snapshot.valueLists.grades
  return (
    <Section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6 lg:mb-10">
        <div className="max-w-xl">
          <h2 className="max-w-[14ch]">A resource set for every grade</h2>
          <p className="lead mt-4 max-w-[46ch]">
            CAPS-aligned tests, memos and summaries for Grades 3 to 7 — pick your child’s grade to start.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {grades.map((grade) => (
          <GradeCard key={grade} grade={grade} count={productsForGrade(snapshot, grade).length} />
        ))}
      </div>
    </Section>
  )
}
