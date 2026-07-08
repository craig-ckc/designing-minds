import { type CmsSnapshot } from '@designing-minds/cms'
import { Button } from '../ui/button'
import { Eyebrow } from '../ui/eyebrow'
import { FaqAccordion } from '../ui/faq-accordion'
import { Section, SectionNotice } from '../ui/section'

export function HomeFaqSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  const homeFaqs = snapshot?.faqs.filter((f) => f.published).slice(0, 5) ?? []
  return (
    <Section className="bg-surface-alt">
      <div className="mx-auto max-w-[820px]">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <Eyebrow>FAQ</Eyebrow>
          </div>
          <h2>Common questions</h2>
        </div>
        {snapshot ? (
          <FaqAccordion faqs={homeFaqs} />
        ) : (
          <SectionNotice
            title={loadError ? 'Help topics are unavailable' : 'Loading help topics...'}
            body={loadError ?? 'Frequently asked questions will appear here when the content request finishes.'}
          />
        )}
        <div className="mt-6 text-center">
          <Button to="/help" variant="text">
            See all help topics
          </Button>
        </div>
      </div>
    </Section>
  )
}

