import { Link } from 'react-router-dom'
import { GRADE_BLURB, gradeToSlug } from '../../content/site'
import { gradeColorway } from '../../lib/grade-colors'
import { ArrowAffordance } from './icon'

const GRADE_BACKGROUNDS: Record<string, string> = {
  'Grade 3': '/images/grade-background-3.svg',
  'Grade 4': '/images/grade-background-4.svg',
  'Grade 5': '/images/grade-background-5.svg',
  'Grade 6': '/images/grade-background-6.svg',
  'Grade 7': '/images/grade-background-7.svg',
}

/**
 * One grade tile, shared by the homepage carousel and the Grades page grid.
 * Compact, grade-coloured tile with a shared decorative line illustration.
 * Width is controlled by the parent via `className`. `compact` shrinks the
 * tile below `sm` (shorter, no blurb, arrow-only affordance) so a two-column
 * phone grid stays scannable; from `sm` up it matches the default tile.
 */
export function GradeCard({ grade, count, compact = false, className = '' }: { grade: string; count?: number; compact?: boolean; className?: string }) {
  const { band, fg } = gradeColorway(grade)
  return (
    <Link
      to={`/grades/${gradeToSlug(grade)}`}
      data-card
      className={`group relative flex ${compact ? 'min-h-28 sm:min-h-56' : 'min-h-56'} flex-col overflow-hidden rounded-card ${band} transition-transform duration-200 ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40"
        style={{ backgroundImage: `url(${GRADE_BACKGROUNDS[grade] ?? '/images/card-background-01.svg'})` }}
        aria-hidden="true"
      />

      <div className={`relative z-10 flex flex-1 flex-col ${compact ? 'p-4 sm:p-6' : 'p-6'}`}>
        <h3 className={`text-[1.5rem] ${fg}`}>{grade}</h3>
        <p className={`mt-1.5 max-w-[30ch] text-body-sm line-clamp-2 ${fg} ${compact ? 'hidden sm:block' : ''}`}>
          {GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}
        </p>
        {typeof count === 'number' ? (
          <div className={`mt-auto flex items-center justify-between gap-4 text-body-sm ${compact ? 'pt-3 sm:pt-6' : 'pt-6'}`}>
            <span className={fg}>{count} resources</span>
            <span className={`inline-flex items-center gap-1.5 font-bold ${fg}`}>
              <span className={compact ? 'hidden sm:inline' : undefined}>Browse</span>
              <ArrowAffordance />
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  )
}
