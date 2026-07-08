import { type CmsSnapshot } from '@designing-minds/cms'
import { Section, SectionNotice } from '../ui/section'
import { TestimonialsSection } from './testimonials-section'

export function AboutTestimonialsSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  if (snapshot) return <TestimonialsSection testimonials={snapshot.testimonials.filter((t) => t.published)} />

  return (
    <Section>
      <SectionNotice
        title={loadError ? 'Testimonials are unavailable' : 'Loading testimonials...'}
        body={loadError ?? 'The story is ready now; parent feedback will appear when the content request finishes.'}
      />
    </Section>
  )
}

