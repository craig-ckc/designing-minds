import { productsForGrade } from '@designing-minds/cms'
import { useCatalogSnapshot } from '../lib/catalog'
import { Container } from '../components/ui/container'
import { GradeCard } from '../components/ui/grade-card'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { PageHeader } from '../components/ui/headings'

export function GradesPage() {
  const snapshot = useCatalogSnapshot()
  return (
    <>
      <PageHeader
        width="full"
        title="Grades 3 to 7"
        lead="Pick a grade to see its CAPS-aligned resources and bundles. CAPS stands for Curriculum and Assessment Policy Statement, South Africa’s national curriculum policy."
      >
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Grades" />
        </div>
      </PageHeader>

      <section className="section-tight">
        <Container width="full">
          <h2 className="sr-only">Browse resources by grade</h2>
          <div className="grade-grid">
            {snapshot.valueLists.grades.map((grade) => (
              <GradeCard key={grade} grade={grade} count={productsForGrade(snapshot, grade).length} />
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
