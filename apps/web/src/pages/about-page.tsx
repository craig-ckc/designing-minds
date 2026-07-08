import { type CmsSnapshot } from '@designing-minds/cms'
import { AboutCtaSection } from '../components/sections/about-cta-section'
import { AboutHeroSection } from '../components/sections/about-hero-section'
import { AboutStatsSection } from '../components/sections/about-stats-section'
import { AboutTestimonialsSection } from '../components/sections/about-testimonials-section'
import { FounderSection } from '../components/sections/founder-section'
import { OurStorySection } from '../components/sections/our-story-section'

export function AboutPage({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  return (
    <>
      <AboutHeroSection />
      <AboutStatsSection snapshot={snapshot} />
      <OurStorySection />
      <FounderSection />
      <AboutTestimonialsSection snapshot={snapshot} loadError={loadError} />
      <AboutCtaSection />
    </>
  )
}
