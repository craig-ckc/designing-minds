import { Link } from 'react-router-dom'
import { GRADE_BLURB, gradeToSlug } from '../../content/site'
import { gradeColorway } from '../../lib/grade-colors'
import { Icon } from './icon'

/**
 * One grade tile, shared by the homepage carousel and the Grades page grid.
 * Padded top content (grade-coloured title, blurb, and — with `count` — the
 * resources indicator + Browse link), then a full-bleed image flush to the
 * card's bottom/side edges. Swap `/placeholder-image.svg` for a per-grade image
 * later. Width is controlled by the parent via `className`.
 */
export function GradeCard({ grade, count, className = '' }: { grade: string; count?: number; className?: string }) {
  const { fg } = gradeColorway(grade)
  return (
    <Link
      to={`/grades/${gradeToSlug(grade)}`}
      data-card
      className={`group flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-primary/40 ${className}`}
    >
      <div className="p-6">
        <h3 className={`text-[1.5rem] ${fg}`}>{grade}</h3>
        <p className="mt-1.5 text-body-sm text-muted line-clamp-2">
          {GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}
        </p>
        {typeof count === 'number' ? (
          <div className="mt-4 flex items-center justify-between text-body-sm">
            <span className="text-muted">{count} resources</span>
            <span className={`inline-flex items-center gap-1.5 font-bold ${fg}`}>
              Browse
              <span className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
                <Icon name="arrow" />
              </span>
            </span>
          </div>
        ) : null}
      </div>

      {/* Full-bleed image, flush to the card edges (only the top content is padded). */}
      <img
        src="/placeholder-image.svg"
        alt=""
        aria-hidden
        loading="lazy"
        className="mt-auto block aspect-[16/10] w-full object-cover"
      />
    </Link>
  )
}
