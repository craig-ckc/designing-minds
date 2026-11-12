import { Link } from 'react-router-dom'
import { GRADE_BLURB, gradeToSlug } from '../../content/site'
import { gradeColorway } from '../../lib/grade-colors'
import { ArrowAffordance } from './icon'

/**
 * One grade tile, shared by the homepage carousel and the Grades page grid.
 * Compact, flat grade-coloured tile.
 * Width is controlled by the parent via `className`. `compact` shrinks the
 * tile below `sm` (shorter, no blurb, arrow-only affordance) so a two-column
 * phone grid stays scannable; from `sm` up it matches the default tile.
 */
export function GradeCard({ grade, count, compact = false, className = '' }: { grade: string; count?: number; compact?: boolean; className?: string }) {
  const { band, fg } = gradeColorway(grade)
  return (
    <Link
      to={`/shop?grade=${gradeToSlug(grade)}`}
      data-card
      className={`group relative flex ${compact ? 'min-h-28 sm:min-h-56' : 'min-h-56'} flex-col overflow-hidden rounded-md ${band} transition-transform duration-200 ${className}`}
    >
      <div className={`relative z-10 flex flex-1 flex-col ${compact ? 'p-4 sm:p-6' : 'p-6'}`}>
        <h3 className={`text-[1.5rem] ${fg}`}>{grade}</h3>
        <p className={`mt-2 max-w-[30ch] text-body line-clamp-2 ${fg} ${compact ? 'hidden sm:block' : ''}`}>
          {GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}
        </p>
        {typeof count === 'number' ? (
          <div className={`mt-auto flex items-center justify-between gap-4 text-body ${compact ? 'pt-3 sm:pt-6' : 'pt-6'}`}>
            <span className={fg}>{count} resources</span>
            <span className={`inline-flex items-center gap-2 font-bold ${fg}`}>
              <span className={compact ? 'hidden sm:inline' : undefined}>Browse</span>
              <ArrowAffordance />
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  )
}
