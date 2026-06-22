import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { repository } from '../repository'
import { Icon, type IconName } from './ui'
import { btn } from './tokens'

type NavItem = { to: string; label: string; icon: IconName }
const NAV_GROUPS: { heading?: string; items: NavItem[] }[] = [
  { items: [{ to: '/', label: 'Dashboard', icon: 'grid' }] },
  {
    heading: 'Catalogue',
    items: [
      { to: '/products', label: 'Products', icon: 'box' },
      { to: '/subjects', label: 'Subjects', icon: 'spark' },
      { to: '/faqs', label: 'FAQs', icon: 'doc' },
      { to: '/testimonials', label: 'Testimonials', icon: 'star' },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { to: '/orders', label: 'Orders', icon: 'receipt' },
      { to: '/customers', label: 'Customers', icon: 'users' },
      { to: '/payments', label: 'Payments', icon: 'rand' },
    ],
  },
]

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.95rem] transition ${
    isActive ? 'bg-ink font-medium text-white' : 'text-ink-soft hover:bg-surface-alt hover:text-ink'
  }`

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV_GROUPS.map((group, index) => (
        <div key={group.heading ?? `group-${index}`} className="contents">
          {/* Divider between groups (Webflow-style: Catalogue | Operations) */}
          {index > 0 ? <div className="my-3 hidden h-px bg-line lg:block" /> : null}
          {group.heading ? (
            <p className="hidden px-3 pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted lg:block">
              {group.heading}
            </p>
          ) : null}
          {group.items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkCls} onClick={onNavigate}>
              <span className="h-[18px] w-[18px] flex-none">
                <Icon name={item.icon} />
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3 font-semibold">
      <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-lg bg-ink text-[0.95rem] tracking-[-0.04em] text-white">
        DM
      </span>
      <span className="leading-tight">
        <span className="block text-[1.02rem] tracking-[-0.02em]">Designing Minds</span>
        <span className="block text-[0.68rem] font-normal tracking-[0.04em] text-muted">Admin</span>
      </span>
    </div>
  )
}

export function Shell({
  children,
  onReset,
  saving,
  message,
  error,
}: {
  children: ReactNode
  onReset: () => void
  saving: boolean
  message: string | null
  error: string | null
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar — fixed width on large screens, becomes a top nav strip below 900px */}
      <aside className="flex-none border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="border-b border-line px-5 py-5">
            <Brand />
          </div>
          <nav className="flex flex-row flex-wrap gap-1 px-3 py-4 lg:flex-1 lg:flex-col lg:flex-nowrap">
            <NavItems />
          </nav>
          <div className="hidden border-t border-line px-5 py-4 text-[0.78rem] text-muted lg:block">
            Wireframe preview · {repository.mode}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 sm:px-8 lg:px-12">
            <div>
              <h4 className="text-[1.02rem]">Designing Minds — Admin</h4>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-line px-3 py-1 text-[0.82rem] text-ink-soft sm:inline-flex">
                Provider: <strong className="font-medium">{repository.mode}</strong>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.82rem] ${
                  repository.canWrite ? 'border border-ink text-ink' : 'border border-line text-muted'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {repository.canWrite ? 'Write access' : 'Read only'}
              </span>
              <button type="button" onClick={onReset} disabled={saving} className={btn('ghost', 'text-[0.88rem]')}>
                Reset content
              </button>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className={btn('ghost', 'text-[0.88rem]')}
              >
                Open website
                <span className="h-3.5 w-3.5">
                  <Icon name="external" />
                </span>
              </a>
            </div>
          </div>

          {(message || error) && (
            <div className="px-5 pb-3 sm:px-8 lg:px-12">
              {error ? (
                <div className="rounded-md border border-ink bg-surface-alt px-4 py-2.5 text-[0.9rem] text-ink">
                  {error}
                </div>
              ) : null}
              {message && !error ? (
                <div className="rounded-md border border-line bg-surface-alt px-4 py-2.5 text-[0.9rem] text-ink-soft">
                  {message}
                </div>
              ) : null}
            </div>
          )}
        </header>

        <main className="flex-1 bg-surface-alt px-5 py-8 sm:px-8 lg:px-12">{children}</main>
      </div>
    </div>
  )
}
