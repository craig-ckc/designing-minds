import { Link } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { GRADE_BLURB, gradeToSlug } from '../../content/site'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'
import fallbackGrades from '../../content/home/fallback-grades.json'
import gradeColorways from '../../content/home/grade-colorways.json'

export function GradeFinderSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const grades = snapshot?.valueLists.grades ?? fallbackGrades
  return (
    <Section>
      <div className="mb-10 grid gap-6 lg:mb-12 lg:grid-cols-2 lg:items-end">
        <h2 className="max-w-[14ch]">A resource set for every grade</h2>
        <p className="lead max-w-[46ch]">
          CAPS-aligned tests, memos and summaries for Grades 3 to 7 — pick your child’s grade to start.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grades.map((grade, index) => {
          const cw = gradeColorways[index % gradeColorways.length]
          const number = grade.replace(/[^0-9]/g, '') || grade
          return (
            <Link
              key={grade}
              to={`/grades/${gradeToSlug(grade)}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-soft transition-shadow hover:shadow-card"
            >
              <div className={`relative flex aspect-[16/10] items-center justify-center ${cw}`}>
                <span className="text-[4rem] font-extrabold leading-none tracking-[-0.04em]">{number}</span>
                <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-pill bg-surface/80 text-ink transition-transform group-hover:translate-x-0.5">
                  <span className="h-4 w-4">
                    <Icon name="arrow" />
                  </span>
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-[1.4rem]">{grade}</h3>
                <p className="mt-1 text-body-sm text-muted line-clamp-2">
                  {GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </Section>
  )
}
