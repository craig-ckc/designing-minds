import { Link } from 'react-router-dom'
import { GRADE_BLURB, gradeToSlug } from '../../content/site'
import { gradeColorway } from '../../lib/grade-colors'
import { Icon } from './icon'

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
 * Width is controlled by the parent via `className`.
 */
export function GradeCard({ grade, count, className = '' }: { grade: string; count?: number; className?: string }) {
  const { band, fg } = gradeColorway(grade)
  return (
    <Link
      to={`/grades/${gradeToSlug(grade)}`}
      data-card
      className={`group relative flex min-h-56 flex-col overflow-hidden rounded-card ${band} transition-transform duration-200 ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40"
        style={{ backgroundImage: `url(${GRADE_BACKGROUNDS[grade] ?? '/images/card-background-01.svg'})` }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-1 flex-col p-6">
        <h3 className={`text-[1.5rem] ${fg}`}>{grade}</h3>
        <p className={`mt-1.5 max-w-[30ch] text-body-sm line-clamp-2 ${fg}`}>
          {GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}
        </p>
        {typeof count === 'number' ? (
          <div className="mt-auto flex items-center justify-between gap-4 pt-6 text-body-sm">
            <span className={fg}>{count} resources</span>
            <span className={`inline-flex items-center gap-1.5 font-bold ${fg}`}>
              Browse
              <span className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
                <Icon name="arrow" />
              </span>
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  )
}
