import { type CmsSnapshot, accessPlanTiers } from '@designing-minds/cms'
import { Section, SectionNotice } from '../ui/section'
import { PricingSection } from './pricing-section'

export function AccessPlansSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  if (snapshot) return <PricingSection tiers={accessPlanTiers(snapshot)} />
  return (
    <Section>
      <SectionNotice
        title={loadError ? 'Access plans are unavailable' : 'Loading access plans...'}
        body={loadError ?? 'The rest of the page is ready while we fetch the latest plan details.'}
      />
    </Section>
  )
}

