import { Section } from '../components/ui/section'
import { Breadcrumb } from '../components/ui/breadcrumb'
import { PageHeader } from '../components/ui/headings'
import { Button } from '../components/ui/button'

type LegalKind = 'privacy' | 'terms' | 'refund'

const CONTENT: Record<LegalKind, { title: string; sections: string[] }> = {
  privacy: {
    title: 'Privacy Policy',
    sections: ['Information we collect', 'How we use your information', 'Cookies and analytics', 'Data retention', 'Your rights', 'Contact'],
  },
  terms: {
    title: 'Terms & Conditions',
    sections: ['Using the site', 'Accounts', 'Purchases and payment', 'Digital delivery', 'Acceptable use and licensing', 'Liability', 'Contact'],
  },
  refund: {
    title: 'Refund Policy',
    sections: ['Digital products', 'Duplicate or accidental purchases', 'How to request a refund', 'Processing time', 'Contact'],
  },
}

export function LegalPage({ kind }: { kind: LegalKind }) {
  const doc = CONTENT[kind]
  return (
    <>
      <PageHeader title={doc.title} lead="Effective date: 1 January 2026.">
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current={doc.title} />
        </div>
      </PageHeader>

      <Section>
          <div className="mx-auto grid max-w-readable gap-9">
            {doc.sections.map((heading, index) => (
              <div key={heading} className="grid gap-3">
                <h3>
                  {index + 1}. {heading}
                </h3>
                <p className="text-ink-soft">
                  Placeholder policy copy for “{heading}”. Final legal wording will be supplied before launch.
                </p>
                <p className="text-muted">
                  This wireframe shows section structure only — plain-language paragraphs go here.
                </p>
              </div>
            ))}
            <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
              <span className="text-muted">Questions about this policy?</span>
              <Button to="/contact" variant="solid" size="sm">
                Contact support
              </Button>
            </div>
          </div>
      </Section>
    </>
  )
}
