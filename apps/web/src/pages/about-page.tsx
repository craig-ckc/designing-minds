import { useCatalog } from '../lib/catalog'
import { AboutConnectSection } from '../components/sections/about-connect-section'
import { AboutCtaSection } from '../components/sections/about-cta-section'
import { AboutHeroSection } from '../components/sections/about-hero-section'
import { AboutStorySection } from '../components/sections/about-story-section'
import { AboutTestimonialsSection } from '../components/sections/about-testimonials-section'
import { AboutValuesSection } from '../components/sections/about-values-section'
import { OurStorySection } from '../components/sections/our-story-section'
import { TrustStatsSection } from '../components/sections/trust-stats-section'

export function AboutPage() {
  const { state: { snapshot, error: loadError } } = useCatalog()
  return (
    <>
      <AboutHeroSection />
      <OurStorySection />
      <TrustStatsSection caption="The difference we’ve made so far" />
      <AboutStorySection />
      <AboutValuesSection />
      <AboutTestimonialsSection snapshot={snapshot} loadError={loadError} />
      <AboutConnectSection />
      <AboutCtaSection snapshot={snapshot} />
    </>
  )
}
