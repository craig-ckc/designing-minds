import { SplitHero } from './split-hero'

export function AboutHeroSection() {
  return (
    <SplitHero
      title="Shaping confident learners, one test at a time"
      lead={
        <>
          Affordable practice tests aligned with CAPS, South Africa’s Curriculum and Assessment Policy Statement,
          help learners prepare with confidence and give parents simple support at home.
        </>
      }
      actionLabel="Browse resources"
      actionTo="/shop"
      image="/images/paintings/about-hero-study-corner.avif"
    />
  )
}
