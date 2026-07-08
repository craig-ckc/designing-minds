import { Link } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { gradeToSlug } from '../../content/site'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { Section } from '../ui/section'
import fallbackGrades from '../../content/home/fallback-grades.json'

export function FinalCtaSection({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const grades = snapshot?.valueLists.grades ?? fallbackGrades
  return (
    <Section>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-8 text-center shadow-card lg:p-16">
        <span aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-butter/50" />
        <span aria-hidden className="pointer-events-none absolute -bottom-20 -right-12 h-64 w-64 rounded-full bg-lagoon/50" />
        <div className="relative">
          <h2 className="mx-auto max-w-[18ch]">Ready to help your child practise?</h2>
          <p className="mx-auto mt-4 max-w-[520px] lead">
            Pick your child’s grade to browse CAPS-aligned resources — or grab a term bundle and save.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4.5">
            {grades.map((grade) => (
              <Link
                key={grade}
                to={`/grades/${gradeToSlug(grade)}`}
                className="rounded-full border border-line-strong bg-surface px-5 py-2.5 text-[0.95rem] font-bold transition-colors hover:border-primary hover:text-primary"
              >
                {grade}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/shop" variant="solid">
              Browse all resources
              <span className="h-4 w-4">
                <Icon name="arrow" />
              </span>
            </Button>
            <Button to="/packages" variant="soft">
              See bundles &amp; plans
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}
