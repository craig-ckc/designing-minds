import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { Container } from '../ui/Container'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-[0.95rem] hover:bg-surface-alt hover:text-ink ${
    isActive ? 'font-medium text-ink' : 'text-ink-soft'
  }`

export function Navbar({ snapshot }: { snapshot: CmsSnapshot | null }) {
  const [megaOpen, setMegaOpen] = useState(false)
  const closeMega = () => setMegaOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <Container className="flex min-h-[72px] items-center gap-7">
        <Link to="/" onClick={closeMega} className="flex items-center gap-3 font-semibold">
          <span className="grid h-[38px] w-[38px] place-items-center rounded-lg bg-ink text-[0.95rem] tracking-[-0.04em] text-white">
            DM
          </span>
          <span className="leading-tight">
            <span className="block text-[1.05rem] tracking-[-0.02em]">Designing Minds</span>
            <span className="block text-[0.68rem] font-normal tracking-[0.04em] text-muted">
              CAPS-aligned assessments
            </span>
          </span>
        </Link>

        <nav className="ml-3 hidden items-center gap-1 md:flex">
          <NavLink to="/" end onClick={closeMega} className={navLinkCls}>
            Home
          </NavLink>
          <button
            type="button"
            onClick={() => setMegaOpen((open) => !open)}
            aria-expanded={megaOpen}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[0.95rem] hover:bg-surface-alt hover:text-ink ${
              megaOpen ? 'font-medium text-ink' : 'text-ink-soft'
            }`}
          >
            Shop
            <span className={`h-3.5 w-3.5 transition-transform ${megaOpen ? 'rotate-180' : ''}`}>
              <Icon name="chevron" />
            </span>
          </button>
          <NavLink to="/about" onClick={closeMega} className={navLinkCls}>
            About
          </NavLink>
          <NavLink to="/contact" onClick={closeMega} className={navLinkCls}>
            Contact
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <span className="hidden items-center gap-2 text-[0.9rem] text-ink-soft sm:inline-flex">
            <span className="h-4 w-4">
              <Icon name="cart" />
            </span>
            Cart (0)
          </span>
          <Button to="/shop" onClick={closeMega} variant="text" className="text-[0.9rem]">
            Browse Tests
          </Button>
        </div>
      </Container>

      {megaOpen ? <ShopMegaMenu snapshot={snapshot} onClose={closeMega} /> : null}
    </header>
  )
}

function ShopMegaMenu({ snapshot, onClose }: { snapshot: CmsSnapshot | null; onClose: () => void }) {
  const grades = snapshot?.filters.grades ?? []
  const subjects = (snapshot?.filters.subjects ?? []).slice(0, 6)

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="fixed inset-x-0 bottom-0 top-[72px] z-30 cursor-default bg-ink/10"
      />
      <div className="absolute inset-x-0 top-full z-40 hidden border-t border-line bg-white shadow-sm md:block">
        <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_1fr_1.2fr]">
          <div>
            <h5 className="mb-4 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted">Shop by grade</h5>
            <ul className="grid gap-2.5">
              {grades.map((grade) => (
                <li key={grade}>
                  <Link
                    to={`/shop?grade=${encodeURIComponent(grade)}`}
                    onClick={onClose}
                    className="text-ink-soft hover:text-ink"
                  >
                    {grade}
                  </Link>
                </li>
              ))}
              <li className="pt-1.5">
                <Link
                  to="/shop"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 font-medium text-ink underline underline-offset-4"
                >
                  Browse all tests
                  <span className="h-4 w-4">
                    <Icon name="arrow" />
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-muted">Shop by subject</h5>
            <ul className="grid gap-2.5">
              {subjects.map((subject) => (
                <li key={subject}>
                  <Link
                    to={`/shop?subject=${encodeURIComponent(subject)}`}
                    onClick={onClose}
                    className="text-ink-soft hover:text-ink"
                  >
                    {subject}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/shop"
            onClick={onClose}
            className="flex flex-col justify-between gap-6 rounded-[10px] bg-ink p-7 text-white transition hover:opacity-95"
          >
            <div>
              <p className="mb-3 inline-block text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/60">
                Bundles
              </p>
              <h4 className="text-white">Full Year Test Bundles</h4>
              <p className="mt-2 text-[0.92rem] text-white/70">
                Every CAPS-aligned test for Grades 4–7, automatically delivered each term. R1,200 once-off.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 font-medium underline underline-offset-4">
              Get full year access
              <span className="h-4 w-4">
                <Icon name="arrow" />
              </span>
            </span>
          </Link>
        </Container>
      </div>
    </>
  )
}
