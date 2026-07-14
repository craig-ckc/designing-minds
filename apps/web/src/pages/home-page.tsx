import { type CmsSnapshot } from '@designing-minds/cms'
import { AccessPlansSection } from '../components/sections/access-plans-section'
import { BundleCtaSection } from '../components/sections/bundle-cta-section'
import { FeatureBentoSection } from '../components/sections/feature-bento-section'
import { FinalCtaSection } from '../components/sections/final-cta-section'
import { GetToKnowSection } from '../components/sections/get-to-know-section'
import { GradeFinderSection } from '../components/sections/grade-finder-section'
import { HomeFaqSection } from '../components/sections/home-faq-section'
import { HomeHeroSection } from '../components/sections/home-hero-section'
import { StatsSection, type Stat } from '../components/sections/stats-section'
import { HomeTestimonialsSection } from '../components/sections/home-testimonials-section'
import { HowItWorksSection } from '../components/sections/how-it-works-section'

export function HomePage({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  const stats: Stat[] = [
    { value: snapshot ? String(snapshot.stats.gradeCount) : '...', label: 'Grades supported', icon: 'book' },
    { value: 'CAPS', label: 'South African curriculum', icon: 'shield' },
    { value: snapshot ? String(snapshot.stats.productCount) : '...', label: 'Resources & bundles', icon: 'doc' },
    { value: snapshot ? String(snapshot.stats.subjectCount) : '...', label: 'Subjects covered', icon: 'palette' },
  ]
  return (
    <>
      <HomeHeroSection snapshot={snapshot} />
      <StatsSection stats={stats} caption="Practice resources designed for South African learners" />
      <GetToKnowSection />
      <HomeTestimonialsSection snapshot={snapshot} />
      <FeatureBentoSection />
      <GradeFinderSection snapshot={snapshot} loadError={loadError} />
      <AccessPlansSection snapshot={snapshot} loadError={loadError} />
      <HowItWorksSection />
      <BundleCtaSection />
      <HomeFaqSection snapshot={snapshot} loadError={loadError} />
      <FinalCtaSection />
    </>
  )
}
