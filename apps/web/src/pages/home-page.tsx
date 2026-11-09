import { type CmsSnapshot } from '@designing-minds/cms'
import { HomeFeaturedSection } from '../components/sections/home-featured-section'
import { FinalCtaSection } from '../components/sections/final-cta-section'
import { GetToKnowSection } from '../components/sections/get-to-know-section'
import { GradeFinderSection } from '../components/sections/grade-finder-section'
import { HomeHeroSection } from '../components/sections/home-hero-section'
import { HomeTestimonialsSection } from '../components/sections/home-testimonials-section'

export function HomePage({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  return (
    <>
      <HomeHeroSection snapshot={snapshot} />
      <HomeFeaturedSection snapshot={snapshot} loadError={loadError} />
      <GradeFinderSection snapshot={snapshot} loadError={loadError} />
      <GetToKnowSection />
      <HomeTestimonialsSection snapshot={snapshot} />
      <FinalCtaSection snapshot={snapshot} />
    </>
  )
}
