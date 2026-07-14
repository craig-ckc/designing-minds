import { type CmsSnapshot } from '@designing-minds/cms'
import { AboutConnectSection } from '../components/sections/about-connect-section'
import { AboutCtaSection } from '../components/sections/about-cta-section'
import { AboutHeroSection } from '../components/sections/about-hero-section'
import { AboutStorySection } from '../components/sections/about-story-section'
import { AboutTestimonialsSection } from '../components/sections/about-testimonials-section'
import { AboutValuesSection } from '../components/sections/about-values-section'
import { OurStorySection } from '../components/sections/our-story-section'
import { StatsSection, type Stat } from '../components/sections/stats-section'

export function AboutPage({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  const stats: Stat[] = [
    { value: 'South Africa', label: 'Designed for local learners', icon: 'user' },
    { value: snapshot ? String(snapshot.stats.gradeCount) : '5', label: 'Grades supported', icon: 'book' },
    { value: snapshot ? String(snapshot.stats.productCount) : '…', label: 'Resources created', icon: 'doc' },
    { value: '100%', label: 'CAPS aligned', icon: 'shield' },
  ]
  return (
    <>
      <AboutHeroSection />
      <OurStorySection />
      <StatsSection stats={stats} caption="The difference we’ve made so far" />
      <AboutStorySection />
      <AboutValuesSection />
      <AboutTestimonialsSection snapshot={snapshot} loadError={loadError} />
      <AboutConnectSection />
      <AboutCtaSection />
    </>
  )
}
