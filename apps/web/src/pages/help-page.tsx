import { useMemo } from 'react'
import { type CmsSnapshot, type Faq } from '@designing-minds/cms'
import { Section } from '../components/ui/section'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { PageHeader } from '../components/ui/headings'
import { FaqAccordion } from '../components/ui/faq-accordion'
import { Button } from '../components/ui/button'

const categorySlug = (category: string) =>
  category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function HelpPage({ snapshot }: { snapshot: CmsSnapshot }) {
  const byCategory = useMemo(() => {
    const groups = new Map<string, Faq[]>()
    for (const faq of snapshot.faqs.filter((f) => f.published).sort((a, b) => a.sortOrder - b.sortOrder)) {
      const list = groups.get(faq.category) ?? []
      list.push(faq)
      groups.set(faq.category, list)
    }
    return [...groups.entries()]
  }, [snapshot])

  return (
    <>
      <PageHeader
        title="Downloads, printing, accounts & more"
        lead="Answers to common questions about buying, downloading, printing, CAPS alignment, licensing, and refunds."
      >
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Help" />
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="lg:sticky lg:top-[var(--sticky-offset)] lg:self-start">
            <h4 className="mb-3">Topics</h4>
            <ul className="grid gap-2 text-ink-soft">
              {byCategory.map(([category]) => (
                <li key={category}>
                  <a href={`#${categorySlug(category)}`} className="hover:text-ink">
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <div className="grid gap-10">
            {byCategory.map(([category, faqs]) => (
              <div key={category} id={categorySlug(category)}>
                <h3 className="mb-3">{category}</h3>
                <FaqAccordion faqs={faqs} />
              </div>
            ))}
          </div>
        </div>

        {/* Only once every topic has been exhausted. */}
        <div className="mt-14 rounded-panel border border-line p-8 text-center lg:mt-20 lg:p-12">
          <h3 className="mx-auto max-w-[20ch]">Still stuck? We’re one message away</h3>
          <p className="mx-auto mt-3 max-w-prose text-muted">
            Can’t find what you’re looking for? Reach our team and we’ll help you out.
          </p>
          <div className="mt-6 flex justify-center">
            <Button to="/contact" variant="solid">
              Contact support
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
