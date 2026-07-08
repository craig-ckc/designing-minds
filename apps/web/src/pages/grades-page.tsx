import { type CmsSnapshot, productsForGrade } from '@designing-minds/cms'
import { GRADE_BLURB, gradeToSlug } from '../content/site'
import { Container } from '../components/ui/container'
import { Card } from '../components/ui/card'
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
                <Card
                  key={grade}
                  to={`/grades/${gradeToSlug(grade)}`}
                  variant="surface"
                  pad="md"
                  className="group flex flex-col gap-4 transition hover:border-primary"
                >
                  <Placeholder label={grade} ratio="16 / 9" className="rounded-none" />
                  <div>
                    <h3>{grade}</h3>
                    <p className="mt-1.5 text-muted">{GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries.'}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-body-sm">
                    <span className="text-muted">{count} resources</span>
                    <span className="inline-flex items-center gap-1.5 font-medium underline underline-offset-4">
                      Browse
                      <Icon name="arrow" size={14} />
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        </Container>
      </section>
    </>
  )
}
