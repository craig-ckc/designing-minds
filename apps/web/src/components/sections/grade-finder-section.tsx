import { type CmsSnapshot } from '@designing-minds/cms'
import { GradeCard } from '../ui/grade-card'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Section, SectionNotice } from '../ui/section'
import { productsForGrade } from '../../lib/products'

/**
 * Figma `GradeFinderSection`: heading and lead, an optional "Browse all resources" text button,
 * then the 3 + 2 grade grid. Home shows the button and compacts tiles on phones; the Grades page
 * hides the button (its hero already links to the shop) and keeps the full tile.
 */
export function GradeFinderSection({
  snapshot,
  loadError,
  showBrowseAll = true,
  compactTiles = true,
}: {
  snapshot: CmsSnapshot | null
  loadError?: string | null
  showBrowseAll?: boolean
  /** Compact two-up tiles below `sm`; from `sm` up every tile is the full card. */
  compactTiles?: boolean
}) {
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
        <div>
          <h2>Explore our resources</h2>
          <p className="lead mt-4 max-w-[500px]">
            CAPS-aligned tests, memos and summaries for Grades 3 to 7. Pick your child’s grade, or browse everything.
          </p>
        </div>
        {showBrowseAll ? (
          <Button to="/shop" variant="text" className="text-body-lg">
            Browse all resources <Icon name="arrow" size={16} />
          </Button>
        ) : null}
      </div>

      <div className={compactTiles ? 'grade-grid grade-grid--compact' : 'grade-grid'}>
        {grades.map((grade) => (
          <GradeCard key={grade} grade={grade} count={productsForGrade(snapshot, grade).length} compact={compactTiles} />
        ))}
      </div>
    </Section>
  )
}
