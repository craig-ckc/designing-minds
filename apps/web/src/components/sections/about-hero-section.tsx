import { CapsAbbr } from '../ui/caps-abbr'
import { PageHero } from './page-hero'

export function AboutHeroSection() {
  return (
    <PageHero
      title="Practice tests that help learners feel ready"
      lead={
        <>
          Affordable practice tests aligned with <CapsAbbr /> that help learners prepare and give parents simple
          support at home.
        </>
      }
      actionLabel="Browse resources"
      actionTo="/shop"
      image="/images/paintings/about-hero-study-corner.avif"
    />
  )
}
