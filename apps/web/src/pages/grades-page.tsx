import { useCatalogSnapshot } from '../lib/catalog'
import { FinalCtaSection } from '../components/sections/final-cta-section'
import { GradeFinderSection } from '../components/sections/grade-finder-section'
import { HomeTestimonialsSection } from '../components/sections/home-testimonials-section'
import { PageHero } from '../components/sections/page-hero'
import { ValuesBanner, type ValueItem } from '../components/sections/about-values-section'
import { CapsAbbr } from '../components/ui/caps-abbr'

const GRADE_INCLUDES: ValueItem[] = [
  {
    title: 'CAPS-aligned',
    body: 'Suitable for learners in every South African province and aligned with the CAPS curriculum.',
  },
  {
    title: 'Memos included',
    body: 'Each test comes with a detailed memorandum, so marking together is simple.',
  },
  {
    title: 'Term by term',
    body: 'Choose practice for the term your child is on, or a bundle for the whole term.',
  },
]

export function GradesPage() {
  const snapshot = useCatalogSnapshot()
  return (
    <>
      <PageHero
        title="Find the right practice for your child’s grade"
        lead={<><CapsAbbr />-aligned tests and memos for Grades 3 to 7, ready to print at home.</>}
        actionLabel="Browse all resources"
        actionTo="/shop"
        image="/images/paintings/grades-hero-classroom-jacarandas.avif"
      />

      {/* The hero already offers "Browse all resources", so the finder drops its own link and
          keeps the full tile on phones (Home compacts it). */}
      <GradeFinderSection snapshot={snapshot} showBrowseAll={false} compactTiles={false} />

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
