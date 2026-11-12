import { useCatalog } from '../lib/catalog'
import { AboutConnectSection } from '../components/sections/about-connect-section'
import { AboutHeroSection } from '../components/sections/about-hero-section'
import { AboutStorySection } from '../components/sections/about-story-section'
import { AboutValuesSection } from '../components/sections/about-values-section'
import { FinalCtaSection } from '../components/sections/final-cta-section'
import { OurStorySection } from '../components/sections/our-story-section'
import { StatsSection } from '../components/sections/stats-section'
import { TestimonialsSection } from '../components/sections/testimonials-section'

export function AboutPage() {
  const { state: { snapshot, error: loadError } } = useCatalog()
  return (
    <>
      <AboutHeroSection />
      <OurStorySection />
      <StatsSection caption="Designing Minds in numbers" />
      <AboutStorySection />
      <AboutValuesSection />
      <TestimonialsSection snapshot={snapshot} loadError={loadError} />
      <AboutConnectSection />
      <FinalCtaSection
        id="about-cta"
        title="Ready to find the right practice for your child?"
        description="Explore our printable CAPS-aligned tests and learning resources."
        actionLabel="View bundles"
        actionTo="/packages"
      />
    </>
  )
}
