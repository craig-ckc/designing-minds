import { bundleTiers, type CmsSnapshot } from '@designing-minds/cms'
import { Section, SectionNotice } from '../ui/section'
import { BundlePricingSection } from './bundle-pricing-section'

export function HomeBundlesSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  if (snapshot) return <BundlePricingSection tiers={bundleTiers(snapshot)} />
  return (
    <Section>
      <SectionNotice
        title={loadError ? 'Bundles are unavailable' : 'Loading bundles...'}
        body={loadError ?? 'The rest of the page is ready while we fetch the latest bundle details.'}
      />
    </Section>
  )
}
