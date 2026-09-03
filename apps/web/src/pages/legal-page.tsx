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
    title: 'Terms of Use',
    sections: [],
  },
  refund: {
    title: 'Refund Policy',
    sections: ['Digital products', 'Duplicate or accidental purchases', 'How to request a refund', 'Processing time', 'Contact'],
  },
}

function TermsOfUse() {
  return (
    <div className="mx-auto grid max-w-readable gap-9 text-ink-soft">
      <p>
        Thank you for purchasing educational resources from Designing Minds. By purchasing, downloading or using any
        Designing Minds resource, you agree to the following Terms of Use.
      </p>

      <div className="grid gap-3">
        <h2>1. Copyright</h2>
        <p>
          All Designing Minds resources, including tests, assessments, summaries, revision materials, worksheets,
          memorandums, activities, graphics and other educational content, are protected by copyright.
        </p>
        <p>Unless otherwise stated, the content remains the intellectual property of Designing Minds.</p>
        <p>Purchasing a resource gives you a licence to use the resource. It does not transfer ownership or copyright to you.</p>
      </div>

      <div className="grid gap-3">
        <h2>2. What You May Do</h2>
        <p>Your purchase is for personal, household or single-classroom use only.</p>
        <p>You may:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Print copies for your own child or children in your household.</li>
          <li>If you are a teacher, print and use the resource with learners in your own classroom.</li>
          <li>Save a copy of the purchased resource on your personal device for your own use.</li>
          <li>Use the resources for educational and revision purposes.</li>
        </ul>
      </div>

      <div className="grid gap-3">
        <h2>3. What You May NOT Do</h2>
        <p>You may not:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Share or forward the PDF files or download links to friends, family members, other parents, teachers or colleagues.</li>
          <li>Upload the files to WhatsApp groups, Facebook groups, Google Drive folders, Dropbox, Telegram or any other shared platform.</li>
          <li>Email or otherwise distribute copies of the digital files to others.</li>
          <li>Resell, reproduce or redistribute Designing Minds resources in digital or printed form.</li>
          <li>Upload or sell the resources on another website, marketplace or social media platform.</li>
          <li>Claim any Designing Minds resource, content or design as your own.</li>
          <li>Remove or alter Designing Minds branding, copyright notices or watermarks.</li>
          <li>Copy, modify or reproduce the resources for commercial purposes without written permission from Designing Minds.</li>
        </ul>
        <p>
          If another parent, teacher or classroom would like to use a Designing Minds resource, they must purchase
          their own copy or licence.
        </p>
      </div>

      <div className="grid gap-3">
        <h2>4. Schools and Multiple Classrooms</h2>
        <p>
          A standard purchase does not give an entire school, grade or teaching team permission to share the digital
          resource.
        </p>
        <p>
          A teacher may use a purchased resource within their own classroom. If the resource will be used or shared
          across multiple classrooms or teachers, please contact Designing Minds regarding appropriate licensing.
        </p>
      </div>

      <div className="grid gap-3">
        <h2>5. Digital Products</h2>
        <p>All Designing Minds resources are supplied as digital PDF products unless otherwise stated.</p>
        <p>
          Customers are responsible for ensuring that they provide the correct email address and have a suitable
          device and PDF reader to access their purchased resources.
        </p>
      </div>

      <div className="grid gap-3">
        <h2>6. Refunds</h2>
        <p>
          Due to the digital nature of our products and the fact that files can be accessed or downloaded immediately,
          refunds or exchanges are generally not offered once a digital resource has been delivered or accessed.
        </p>
        <p>
          If you experience a problem with your order or receive an incorrect or faulty file, please contact Designing
          Minds so that we can assist you.
        </p>
      </div>

      <div className="grid gap-3">
        <h2>7. Unauthorised Sharing</h2>
        <p>Unauthorised copying, sharing, uploading, resale or distribution of Designing Minds resources is prohibited.</p>
        <p>
          Designing Minds reserves the right to take appropriate action where its copyrighted resources are being
          unlawfully reproduced, shared, distributed or sold.
        </p>
      </div>

      <div className="grid gap-3">
        <h2>8. Agreement to These Terms</h2>
        <p>
          By purchasing or downloading a Designing Minds resource, you acknowledge that you have read, understood and
          agreed to these Terms of Use.
        </p>
      </div>

      <div className="grid gap-3 border-t border-line pt-8">
        <p>
          Thank you for supporting Designing Minds and respecting the time and work that goes into creating our
          educational resources.
        </p>
        <p className="font-semibold text-ink">© Designing Minds. All rights reserved.</p>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <span className="text-muted">Questions about these terms?</span>
        <Button to="/contact" variant="solid" size="sm">
          Contact support
        </Button>
      </div>
    </div>
  )
}

export function LegalPage({ kind }: { kind: LegalKind }) {
  const doc = CONTENT[kind]
  return (
    <>
      <PageHeader title={doc.title} lead={kind === 'terms' ? 'Last updated: September 2026.' : 'Effective date: 1 January 2026.'}>
        <div className="mt-6">
          <Breadcrumb trail={[{ to: '/', label: 'Home' }]} current={doc.title} />
        </div>
      </PageHeader>

      <Section>
        {kind === 'terms' ? (
          <TermsOfUse />
        ) : (
          <div className="mx-auto grid max-w-readable gap-9">
            {doc.sections.map((heading, index) => (
              <div key={heading} className="grid gap-3">
                <h2>
                  {index + 1}. {heading}
                </h2>
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
        )}
      </Section>
    </>
  )
}
