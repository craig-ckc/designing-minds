import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ALL, productsForGrade } from '@designing-minds/cms'
import { GradePackageSection } from '../components/sections/grade-package-section'
import { GRADE_BLURB, slugToGrade } from '../content/site'
import { useCatalogSnapshot } from '../lib/catalog'
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
import { CatalogSortControl } from '../components/ui/catalog-sort-control'
import { sortCatalogItems, type CatalogSort } from '../lib/catalog-sort'
import { NotFoundPage } from './not-found-page'

export function GradeDetailPage() {
  const snapshot = useCatalogSnapshot()
  const { gradeSlug } = useParams()
  const grade = gradeSlug ? slugToGrade(gradeSlug) : ''
  const isValidGrade = snapshot.valueLists.grades.includes(grade as never)

  const [term, setTerm] = useState<string>(ALL)
  const [sort, setSort] = useState<CatalogSort>('recommended')
  const all = useMemo(() => (isValidGrade ? productsForGrade(snapshot, grade) : []), [snapshot, grade, isValidGrade])
  const visible = useMemo(() => sortCatalogItems(term === ALL ? all : all.filter((p) => p.term === term), sort, (product) => product), [all, term, sort])
  const { visible: rendered, loadMore } = useCatalogLoadMore(visible, CATALOG_INITIAL_LIMIT, `${term}:${sort}`)
  const subjects = useMemo(() => (isValidGrade ? subjectsForGrade(snapshot, grade) : []), [snapshot, grade, isValidGrade])

  if (!isValidGrade) {
    return <NotFoundPage />
  }

  return (
    <>
      <PageHeader width="full" title={grade} lead={GRADE_BLURB[grade] ?? 'CAPS-aligned tests and summaries for this grade.'}>
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
            <ul className="flex flex-wrap gap-1.5">
              {subjects.map((subject) => (
                <li key={subject}>
                  <Link
                    to={`/shop?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`}
                    className="filter-chip"
                  >
                    {subject}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </PageHeader>

      <div className="sticky top-[var(--header-h)] z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <Container width="full" className="flex flex-wrap items-end gap-3 py-4">
          <div className="min-w-[160px] flex-1 sm:flex-none">
            <Select compact label="Term" value={term} options={[ALL, ...snapshot.valueLists.terms]} onChange={setTerm} />
          </div>
          <Button to="/shop" variant="outline" size="sm" className="filter-control order-3 min-h-8 w-full rounded-pill px-3 py-1 text-xs sm:order-none sm:ml-auto sm:w-auto">
            Advanced filters in Shop
          </Button>
          <CatalogSortControl value={sort} onChange={setSort} />
        </Container>
      </div>

      {/* Bundles lead, singles follow — a visitor picking a grade sees the
          cheaper way to buy the same resources before the R50 test wall. */}
      <GradePackageSection snapshot={snapshot} grade={grade} />

      <section className="section-tight">
        <Container width="full">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-body-lg font-semibold tracking-normal">{visible.length} single resources</h2>
          </div>
          {visible.length > 0 ? (
            <div className="catalog-grid">
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
