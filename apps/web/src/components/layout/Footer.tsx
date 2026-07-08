import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { CONTACT, gradeToSlug } from '../../content/site'
import { repository } from '../../repository'
import { Container } from '../ui/Container'
import { NewsletterForm } from '../NewsletterForm'

export function Footer({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const grades = snapshot?.valueLists.grades ?? []
  return (
    <footer className="mt-auto border-t border-line bg-surface-alt">
      <Container className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:py-[72px]">
        <div>
          <Link to="/" className="flex items-center gap-3 font-semibold">
            <span className="grid h-[38px] w-[38px] place-items-center rounded-lg bg-ink text-[0.95rem] tracking-[-0.04em] text-white">
              DM
            </span>
            <span className="text-[1.05rem] tracking-[-0.02em]">Designing Minds</span>
          </Link>
          <p className="mt-3.5 max-w-[34ch] text-[0.95rem] text-muted">
            Affordable, CAPS-aligned printable tests that help learners across South Africa prepare with confidence.
          </p>
          <NewsletterForm compact source="footer" />
        </div>

        <FooterColumn title="Shop by grade">
          {grades.map((grade) => (
            <li key={grade}>
              <Link className="text-[0.95rem] text-ink-soft hover:text-ink" to={`/grades/${gradeToSlug(grade)}`}>
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
            <a className="text-[0.95rem] text-ink-soft hover:text-ink" href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>
              {CONTACT.phone}
            </a>
          </li>
          <li>
            <a className="text-[0.95rem] text-ink-soft hover:text-ink" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </li>
          <li className="text-[0.95rem] text-muted">{CONTACT.location}</li>
        </FooterColumn>
      </Container>

      <Container className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-5.5 text-[0.88rem] text-muted">
        <span>© 2026 Designing Minds. All rights reserved.</span>
        <span>Wireframe preview · Provider: {repository.mode}</span>
      </Container>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h5 className="mb-4 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted">{title}</h5>
      <ul className="grid gap-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <li>
      <Link className="text-[0.95rem] text-ink-soft hover:text-ink" to={to}>
        {children}
      </Link>
    </li>
  )
}
