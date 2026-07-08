import { Link } from 'react-router-dom'
import { type CmsSnapshot, productsForGrade } from '@designing-minds/cms'
import { GRADE_BLURB, gradeToSlug } from '../content/site'
import { Container } from '../components/ui/container'
import { Icon } from '../components/ui/icon'
import { Placeholder } from '../components/ui/placeholder'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { PageHeader } from '../components/ui/headings'

export function GradesPage({ snapshot }: { snapshot: CmsSnapshot }) {
  return (
    <>
      <PageHeader eyebrow="Browse by grade" title="Grades 3 to 7" lead="Pick a grade to see its CAPS-aligned resources, bundles, and access plans.">
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Grades" />
        </div>
      </PageHeader>

      <section className="section">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {snapshot.valueLists.grades.map((grade) => {
              const count = productsForGrade(snapshot, grade).length
              return (
                <Link
                  key={grade}
                  to={`/grades/${gradeToSlug(grade)}`}
                  className="group flex flex-col gap-4 border border-line bg-surface p-6 transition hover:border-primary"
                >
                  <Placeholder label={grade} ratio="16 / 9" className="rounded-none" />
                  <div>
                    <h3>{grade}</h3>
                    <p className="mt-1.5 text-muted">{GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-[0.9rem]">
                    <span className="text-muted">{count} resources</span>
                    <span className="inline-flex items-center gap-1.5 font-medium underline underline-offset-4">
                      Browse
                      <span className="h-3.5 w-3.5">
                        <Icon name="arrow" />
                      </span>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </Container>
      </section>
    </>
  )
}
