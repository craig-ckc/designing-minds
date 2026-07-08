import { type CmsSnapshot, productsForGrade } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
import { GradeCard } from '../components/ui/grade-card'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { PageHeader } from '../components/ui/headings'

export function GradesPage({ snapshot }: { snapshot: CmsSnapshot }) {
  return (
    <>
      <PageHeader title="Grades 3 to 7" lead="Pick a grade to see its CAPS-aligned resources, bundles, and access plans.">
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Grades" />
        </div>
      </PageHeader>

      <section className="section">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {snapshot.valueLists.grades.map((grade) => (
              <GradeCard key={grade} grade={grade} count={productsForGrade(snapshot, grade).length} />
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
