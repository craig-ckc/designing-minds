import { useCatalog } from '../lib/catalog'
import { HomeFeaturedSection } from '../components/sections/home-featured-section'
import { FinalCtaSection } from '../components/sections/final-cta-section'
import { GetToKnowSection } from '../components/sections/get-to-know-section'
import { GradeFinderSection } from '../components/sections/grade-finder-section'
import { HomeBundlesSection } from '../components/sections/home-bundles-section'
import { HomeHeroSection } from '../components/sections/home-hero-section'
import { HomeTestimonialsSection } from '../components/sections/home-testimonials-section'

export function HomePage() {
  const { state: { snapshot, error: loadError } } = useCatalog()
  return (
    <>
      <HomeHeroSection snapshot={snapshot} />
      <HomeFeaturedSection snapshot={snapshot} loadError={loadError} />
      <GradeFinderSection snapshot={snapshot} loadError={loadError} />
      <GetToKnowSection />
      <HomeBundlesSection snapshot={snapshot} loadError={loadError} />
      <HomeTestimonialsSection snapshot={snapshot} />
      <FinalCtaSection />
    </>
  )
}
