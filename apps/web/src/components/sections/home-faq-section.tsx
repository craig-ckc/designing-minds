import { type CmsSnapshot } from '@designing-minds/cms'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import { FaqAccordion } from '../ui/faq-accordion'
import { Section, SectionNotice } from '../ui/section'

export function HomeFaqSection({ snapshot, loadError }: { snapshot: CmsSnapshot | null; loadError?: string | null }) {
  const homeFaqs = snapshot?.faqs.filter((f) => f.published).slice(0, 6) ?? []
  return (
    <Section>
      <div className="mx-auto max-w-readable">
        <div className="mb-8 text-center">
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
        <div className="mt-10 text-center">
          <Button to="/help" variant="solid">
            See all help topics
            <span className="h-4 w-4">
              <Icon name="arrow" />
            </span>
          </Button>
        </div>
      </div>
    </Section>
  )
}
