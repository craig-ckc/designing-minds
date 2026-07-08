import { useMemo } from 'react'
import { type CmsSnapshot, type Faq } from '@designing-minds/cms'
import { Container } from '../components/ui/container'
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
        eyebrow="Help & support"
        title="Downloads, printing, accounts & more"
        lead="Answers to common questions about buying, downloading, printing, CAPS alignment, licensing, and refunds."
      >
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current="Help" />
        </div>
      </PageHeader>

      <section className="section">
        <Container className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
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
            <div className="mt-6 card p-5">
              <h4 className="mb-2">Still stuck?</h4>
              <p className="mb-3 text-[0.92rem] text-muted">Reach our team and we’ll help you out.</p>
              <Button to="/contact" variant="solid" size="sm">
                Contact support
              </Button>
            </div>
          </aside>

          <div className="grid gap-10">
            {byCategory.map(([category, faqs]) => (
              <div key={category} id={categorySlug(category)}>
                <h3 className="mb-3">{category}</h3>
                <FaqAccordion faqs={faqs} />
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
