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
 * One grade tile, shared by the homepage and the Grades page grid.
 * Grade-coloured artwork sits above the description, like catalogue covers.
 * Width is controlled by the parent via `className`.
 */
export function GradeCard({ grade, count, className = '' }: { grade: string; count?: number; className?: string }) {
  const { band, fg } = gradeColorway(grade)
  return (
    <Link
      to={`/grades/${gradeToSlug(grade)}`}
      data-card
      className={`group flex min-w-0 flex-col overflow-hidden rounded-card bg-surface ${className}`}
    >
      <div className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-card ${band}`} aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40"
          style={{ backgroundImage: `url(${GRADE_BACKGROUNDS[grade] ?? '/images/card-background-01.svg'})` }}
        />
        <span className={`relative text-[6rem] font-extrabold leading-none tracking-[-0.06em] ${fg} motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105`}>
          {grade.replace(/^Grade\s+/i, '')}
        </span>
      </div>

      <div className="catalog-card-body">
        <h3 className="catalog-card-title transition-colors group-hover:text-primary-ink">{grade}</h3>
        <p className="catalog-card-description">
          {GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}
        </p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-6 text-body-sm">
          {typeof count === 'number' ? <span className="text-muted">{count} {count === 1 ? 'resource' : 'resources'}</span> : null}
          <span className="ml-auto inline-flex items-center gap-1.5 font-semibold text-primary-ink">
            Browse
            <ArrowAffordance />
          </span>
        </div>
      </div>
    </Link>
  )
}
