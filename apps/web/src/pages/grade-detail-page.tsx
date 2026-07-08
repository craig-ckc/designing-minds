import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ALL, type CmsSnapshot, productsForGrade } from '@designing-minds/cms'
import { GRADE_BLURB, slugToGrade } from '../content/site'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Select } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { ProductCard } from '../components/ui/product-card'
import { PageHeader } from '../components/ui/headings'
import { NotFoundPage } from './not-found-page'

export function GradeDetailPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { gradeSlug } = useParams()
  const grade = gradeSlug ? slugToGrade(gradeSlug) : ''
  const isValidGrade = snapshot.valueLists.grades.includes(grade as never)

  const [term, setTerm] = useState<string>(ALL)
  const all = useMemo(() => (isValidGrade ? productsForGrade(snapshot, grade) : []), [snapshot, grade, isValidGrade])
  const visible = term === ALL ? all : all.filter((p) => p.term === term)

  if (!isValidGrade) {
    return <NotFoundPage />
  }

  return (
    <>
      <PageHeader title={grade} lead={GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries for this grade.'}>
        <div className="mt-6">
          <Breadcrumb
            trail={[
              { to: '/', label: 'Home' },
              { to: '/grades', label: 'Grades' },
            ]}
            current={grade}
          />
        </div>
      </PageHeader>

      <div className="sticky top-[var(--header-h)] z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <Container className="flex flex-wrap items-end gap-3 py-4">
          <div className="min-w-[160px]">
            <Select label="Term" value={term} options={[ALL, ...snapshot.valueLists.terms]} onChange={setTerm} />
          </div>
          <Button to="/shop" variant="soft" className="ml-auto">
            Advanced filters in Shop
          </Button>
        </Container>
      </div>

      <section className="section">
        <Container>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h4>{visible.length} resources</h4>
          </div>
          {visible.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card variant="surface" pad="none" className="p-7 text-center">
              <h4>Nothing here yet</h4>
              <p className="mt-2 text-muted">No published resources match this term for {grade}.</p>
            </Card>
          )}
        </Container>
      </section>

      <section className="section-tight bg-surface-alt">
        <Container className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3>Cover {grade} in one purchase</h3>
            <p className="mt-1.5 text-muted">See term bundles, full-year bundles, and access plans.</p>
          </div>
          <Link to="/packages" className="inline-flex items-center gap-1.5 font-medium underline underline-offset-4">
            Browse bundles &amp; plans
          </Link>
        </Container>
      </section>
    </>
  )
}
