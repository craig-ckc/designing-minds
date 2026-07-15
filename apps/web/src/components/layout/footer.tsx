import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { CONTACT, gradeToSlug } from '../../content/site'
import { Container } from '../ui/container'
import { Wordmark } from '../ui/wordmark'
import { NewsletterForm } from '../ui/newsletter-form'

export function Footer({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const grades = snapshot?.valueLists.grades ?? []
  const currentYear = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div
        className="bg-bottom bg-no-repeat"
      // style={{ backgroundImage: "url('/images/image-03.png')", backgroundSize: 'max(100%, 64rem) auto' }}
      >
        <Container className="relative z-10 grid grid-cols-2 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5 pb-10">
          <div className="col-span-2">
            <Wordmark sub={false} />
            <p className="mt-3.5 max-w-[34ch] text-body text-muted">
              Affordable, CAPS-aligned printable tests that help learners across South Africa prepare with confidence.
            </p>
            <NewsletterForm compact source="Footer" />
          </div>

          <FooterColumn title="Shop by grade">
            {grades.map((grade) => (
              <li key={grade}>
                <Link className="text-body text-ink-soft hover:text-ink" to={`/grades/${gradeToSlug(grade)}`}>
                  {grade}
                </Link>
              </li>
            ))}
            <FooterLink to="/packages">Bundles & plans</FooterLink>
          </FooterColumn>

          <FooterColumn title="Company">
            <FooterLink to="/about">About</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
            <FooterLink to="/help">Help</FooterLink>
            <FooterLink to="/shop">All resources</FooterLink>
            <FooterLink to="/privacy-policy">Privacy policy</FooterLink>
            <FooterLink to="/terms">Terms</FooterLink>
            <FooterLink to="/refund-policy">Refund policy</FooterLink>
          </FooterColumn>

          <FooterColumn title="Get in touch">
            <li>
              <a className="text-body text-ink-soft hover:text-ink" href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>
                {CONTACT.phone}
              </a>
            </li>
            <li>
              <a className="text-body text-ink-soft hover:text-ink" href={`mailto:${CONTACT.email}`}>
                {CONTACT.email}
              </a>
            </li>
            <li className="text-body text-muted">{CONTACT.location}</li>
          </FooterColumn>
        </Container>

        <div className="h-[clamp(9rem,20vw,18rem)]" >
          <img src="/images/image-03.png" alt="A parent helping a child with schoolwork at a desk" className="w-full h-full object-cover" />
        </div>

        <div className="bg-[#FDF6F0]" >
          <Container className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-line/70 py-5.5 text-label text-muted">
            <span>© {currentYear} Designing Minds. All rights reserved.</span>
            <span>Made for South African learners</span>
          </Container>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-label font-semibold uppercase tracking-[0.1em] text-muted">{title}</h2>
      <ul className="grid gap-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <Link className="text-body text-ink-soft hover:text-ink" to={to}>
        {children}
      </Link>
    </li>
  )
}
