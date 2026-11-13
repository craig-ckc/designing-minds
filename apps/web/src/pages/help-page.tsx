import { useMemo } from 'react'
import { type Faq } from '@designing-minds/cms'
import { useCatalogSnapshot } from '../lib/catalog'
import { Section } from '../components/ui/section'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { PageHeader } from '../components/ui/headings'
import { FaqAccordion } from '../components/ui/faq-accordion'
import { FinalCtaSection } from '../components/sections/final-cta-section'

const categorySlug = (category: string) =>
  category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function HelpPage() {
  const snapshot = useCatalogSnapshot()
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
        title="Frequently asked questions"
        lead="Answers to common questions about buying, downloading, printing, CAPS alignment, licensing, and refunds."
      >
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Help" />
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <aside className="lg:sticky lg:top-[var(--sticky-offset)] lg:self-start">
            <h2 className="mb-3 text-base font-semibold tracking-normal">Topics</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-body text-ink-soft lg:grid lg:gap-2">
              {byCategory.map(([category]) => (
                <li key={category}>
                  {/* inline-flex + min-h-6: topic jump links are a nav list, so they
                      carry the WCAG 2.2 24px minimum target rather than the 22px
                      line box they'd otherwise collapse to. */}
                  <a href={`#${categorySlug(category)}`} className="inline-flex min-h-6 items-center hover:text-ink">
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <div className="grid gap-12">
            {byCategory.map(([category, faqs], index) => (
              <div key={category} id={categorySlug(category)}>
                <h2 className="mb-2 text-h6">{category}</h2>
                {/* The first question on the page starts open, as in the Figma Help screen. */}
                <FaqAccordion faqs={faqs} defaultOpenFirst={index === 0} />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Only once every topic has been exhausted: its own section after the FAQ. */}
      <FinalCtaSection
        id="help-cta"
        title="Still have a question?"
        description="We’re a real team, and we’re happy to help you find the right resource or sort out a download."
        actionLabel="Contact support"
        actionTo="/contact"
      />
    </>
  )
}
