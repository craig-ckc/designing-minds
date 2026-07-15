import { type CmsSnapshot } from '@designing-minds/cms'
import { HomeBundlesSection } from '../components/sections/home-bundles-section'
import { BundleCtaSection } from '../components/sections/bundle-cta-section'
import { FeatureBentoSection } from '../components/sections/feature-bento-section'
import { FinalCtaSection } from '../components/sections/final-cta-section'
import { GetToKnowSection } from '../components/sections/get-to-know-section'
import { GradeFinderSection } from '../components/sections/grade-finder-section'
import { HomeFaqSection } from '../components/sections/home-faq-section'
import { HomeHeroSection } from '../components/sections/home-hero-section'
import { TrustStatsSection } from '../components/sections/trust-stats-section'
import { HomeTestimonialsSection } from '../components/sections/home-testimonials-section'
import { HowItWorksSection } from '../components/sections/how-it-works-section'

export function HomePage({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  return (
    <>
      <HomeHeroSection snapshot={snapshot} />
      <TrustStatsSection snapshot={snapshot} />
      <GetToKnowSection />
      <HomeBundlesSection snapshot={snapshot} loadError={loadError} />
      <HomeTestimonialsSection snapshot={snapshot} />
      <FeatureBentoSection />
      <GradeFinderSection snapshot={snapshot} loadError={loadError} />
      <HowItWorksSection />
      <BundleCtaSection />
      <HomeFaqSection snapshot={snapshot} loadError={loadError} />
      <FinalCtaSection />
    </>
  )
}
