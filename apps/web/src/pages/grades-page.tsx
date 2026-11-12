import { productsForGrade } from '@designing-minds/cms'
import { useCatalogSnapshot } from '../lib/catalog'
import { FinalCtaSection } from '../components/sections/final-cta-section'
import { HomeTestimonialsSection } from '../components/sections/home-testimonials-section'
import { SplitHero } from '../components/sections/split-hero'
import { ValuesBanner, type ValueItem } from '../components/sections/about-values-section'
import { GradeCard } from '../components/ui/grade-card'
import { Section } from '../components/ui/section'

const GRADE_INCLUDES: ValueItem[] = [
  {
    title: 'CAPS-aligned',
    body: 'Suitable for learners in every South African province and aligned with the CAPS curriculum.',
    bar: 'bg-yellow',
  },
  {
    title: 'Memos included',
    body: 'Each test comes with a detailed memorandum, so marking together is simple.',
    bar: 'bg-green',
  },
  {
    title: 'Term by term',
    body: 'Choose practice for the term your child is on, or a bundle for the whole term.',
    bar: 'bg-blue',
  },
]

export function GradesPage() {
  const snapshot = useCatalogSnapshot()
  return (
    <>
      <SplitHero
        title="Find the right practice for your child’s grade"
        lead="CAPS-aligned tests and memos for Grades 3 to 7, ready to print at home. CAPS stands for Curriculum and Assessment Policy Statement, South Africa’s national curriculum policy."
        actionLabel="Browse all resources"
        actionTo="/shop"
        image="/images/paintings/grades-hero-classroom-jacarandas.avif"
      />

      <Section spacing="tight">
        <h2 className="sr-only">Browse resources by grade</h2>
        <div className="grade-grid">
          {snapshot.valueLists.grades.map((grade) => (
            <GradeCard key={grade} grade={grade} count={productsForGrade(snapshot, grade).length} />
          ))}
        </div>
      </Section>

      <ValuesBanner heading="What every grade includes" values={GRADE_INCLUDES} />
      <HomeTestimonialsSection snapshot={snapshot} />
      <FinalCtaSection
        id="grades-cta"
        title="Buy more, save more"
        description="Bundles group a grade’s resources into one discounted, once-off purchase."
        actionLabel="View bundles"
        actionTo="/packages"
      />
    </>
  )
}
