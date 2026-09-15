import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ALL, type CmsSnapshot, productsForGrade } from '@designing-minds/cms'
import { GradePackageSection } from '../components/sections/grade-package-section'
import { GRADE_BLURB, slugToGrade } from '../content/site'
import { subjectAcronymsIn } from '../lib/subject-acronyms'
import { subjectsForGrade } from '../lib/subject-labels'
import { Container } from '../components/ui/container'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { Select } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { ProductCard } from '../components/ui/product-card'
import { PageHeader } from '../components/ui/headings'
import { LoadMoreButton } from '../components/ui/load-more-button'
import { CATALOG_INITIAL_LIMIT, useCatalogLoadMore } from '../lib/deferred-catalog'
import { NotFoundPage } from './not-found-page'

export function GradeDetailPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const { gradeSlug } = useParams()
  const grade = gradeSlug ? slugToGrade(gradeSlug) : ''
  const isValidGrade = snapshot.valueLists.grades.includes(grade as never)

  const [term, setTerm] = useState<string>(ALL)
  const all = useMemo(() => (isValidGrade ? productsForGrade(snapshot, grade) : []), [snapshot, grade, isValidGrade])
  const visible = useMemo(() => (term === ALL ? all : all.filter((p) => p.term === term)), [all, term])
  const { visible: rendered, loadMore } = useCatalogLoadMore(visible, CATALOG_INITIAL_LIMIT, term)
  const subjects = useMemo(() => (isValidGrade ? subjectsForGrade(snapshot, grade) : []), [snapshot, grade, isValidGrade])
  const acronyms = useMemo(() => subjectAcronymsIn(subjects.join(' ')), [subjects])

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
        {subjects.length > 0 ? (
          <nav aria-label={`Subjects in ${grade}`} className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <li key={subject}>
                  <Link
                    to={`/shop?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`}
                    className="inline-flex min-h-6 items-center rounded-pill border border-line-strong px-3.5 py-1.5 text-body-sm font-semibold text-ink-soft transition-colors hover:border-primary hover:text-primary"
                  >
                    {subject}
                  </Link>
                </li>
              ))}
            </ul>
            {acronyms.length > 0 ? (
              <p className="mt-3 text-label text-muted">
                {acronyms.map(({ code, meaning }) => `${code} = ${meaning}`).join(' · ')}
              </p>
            ) : null}
          </nav>
        ) : null}
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

      {/* Bundles lead, singles follow — a visitor picking a grade sees the
          cheaper way to buy the same resources before the R50 test wall. */}
      <GradePackageSection snapshot={snapshot} grade={grade} />

      <section className="section">
        <Container>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2>{visible.length} single resources</h2>
          </div>
          {visible.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rendered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card variant="surface" pad="none" className="p-7 text-center">
              <h2>Nothing here yet</h2>
              <p className="mt-2 text-muted">No published resources match this term for {grade}.</p>
            </Card>
          )}
          <LoadMoreButton remaining={visible.length - rendered.length} itemLabel="resources" onLoadMore={loadMore} />
        </Container>
      </section>

    </>
  )
}
