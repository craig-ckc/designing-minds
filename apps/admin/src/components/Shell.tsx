import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { type CmsSnapshot } from '@designing-minds/cms'
import { repository } from '../repository'
import { Icon } from './ui'

type CollectionKey = 'products' | 'subjects' | 'faqs' | 'testimonials' | 'orders' | 'customers' | 'payments'
type CollectionLink = { to: string; label: string; key: CollectionKey }

const GROUPS: { heading: string; items: CollectionLink[] }[] = [
  {
    heading: 'CMS Collections',
    items: [
      { to: '/products', label: 'Products', key: 'products' },
      { to: '/subjects', label: 'Subjects', key: 'subjects' },
      { to: '/faqs', label: 'FAQs', key: 'faqs' },
      { to: '/testimonials', label: 'Testimonials', key: 'testimonials' },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { to: '/orders', label: 'Orders', key: 'orders' },
      { to: '/customers', label: 'Customers', key: 'customers' },
      { to: '/payments', label: 'Payments', key: 'payments' },
    ],
  },
]

/* ----------------------------- Top app bar ----------------------------- */

function TopBar({ onReset, saving }: { onReset: () => void; saving: boolean }) {
  return (
    <header className="sticky top-0 z-30 flex h-12 flex-none items-center gap-4 border-b border-line bg-surface px-3">
      {/* Left: brand mark + tabs */}
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-ink text-[0.72rem] font-semibold tracking-[-0.04em] text-white">
          DM
        </span>
      </div>

      {/* Right: status + actions + avatar */}
      <div className="ml-auto flex items-center gap-2.5 text-[0.85rem]">
        <span className="hidden items-center gap-1.5 text-muted sm:inline-flex">
          <span className={`h-1.5 w-1.5 rounded-full ${repository.canWrite ? 'bg-ink' : 'bg-line-strong'}`} />
          {repository.canWrite ? 'Write access' : 'Read only'}
        </span>
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="rounded-md px-2.5 py-1 text-ink-soft hover:bg-surface-alt disabled:opacity-50"
        >
          Reset
        </button>
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-line-strong px-2.5 py-1 hover:border-ink"
        >
          Preview
          <span className="h-3.5 w-3.5">
            <Icon name="external" />
          </span>
        </a>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-sunk text-[0.7rem] font-semibold text-ink-soft">
          DM
        </span>
      </div>
    </header>
  )
}

/* ------------------------- Collections panel --------------------------- */

const rowCls = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[0.88rem] transition ${
    isActive ? 'bg-surface-alt font-medium text-ink' : 'text-ink-soft hover:bg-surface-alt hover:text-ink'
  }`

function CollectionsPanel({ snapshot }: { snapshot: CmsSnapshot }) {
  const counts: Record<CollectionKey, number> = {
    products: snapshot.products.length,
    subjects: snapshot.subjects.length,
    faqs: snapshot.faqs.length,
    testimonials: snapshot.testimonials.length,
    orders: snapshot.orders.length,
    customers: snapshot.customers.length,
    payments: snapshot.payments.length,
  }

  return (
    <div className="flex h-full flex-col">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex items-center gap-2.5 border-b border-line px-4 py-3 text-[0.88rem] ${isActive ? 'font-medium text-ink' : 'text-ink-soft'}`
        }
      >
        <span className="h-[16px] w-[16px] flex-none">
          <Icon name="grid" />
        </span>
        Dashboard
      </NavLink>

      <div className="flex-1 overflow-y-auto py-2">
        {GROUPS.map((group) => (
          <div key={group.heading} className="px-2 pb-2">
            <div className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[0.78rem] font-medium text-ink">{group.heading}</span>
            </div>
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={rowCls}>
                <span className="truncate">{item.label}</span>
                <span className="ml-1 flex-none text-[0.78rem] text-muted">{counts[item.key]} items</span>
                <span className="ml-auto h-3.5 w-3.5 flex-none text-muted opacity-0 group-hover:opacity-100 group-[.active]:opacity-100">
                  <Icon name="arrow" />
                </span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-line px-4 py-2.5 text-[0.74rem] text-muted">Wireframe preview · {repository.mode}</div>
    </div>
  )
}

/* --------------------------------- Shell ------------------------------- */

export function Shell({
  children,
  snapshot,
  onReset,
  saving,
  message,
  error,
}: {
  children: ReactNode
  snapshot: CmsSnapshot | null
  onReset: () => void
  saving: boolean
  message: string | null
  error: string | null
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar onReset={onReset} saving={saving} />
      <div className="flex min-h-0 flex-1">
        {/* Collections panel */}
        <aside className="hidden w-[256px] flex-none border-r border-line bg-surface lg:block">
          {snapshot ? <CollectionsPanel snapshot={snapshot} /> : null}
        </aside>

        {/* Workspace */}
        <main className="min-w-0 flex-1 overflow-y-auto bg-surface">
          {(message || error) && (
            <div className="px-6 pt-4">
              {error ? (
                <div className="rounded-md border border-ink bg-surface-alt px-4 py-2.5 text-[0.9rem] text-ink">{error}</div>
              ) : null}
              {message && !error ? (
                <div className="rounded-md border border-line bg-surface-alt px-4 py-2.5 text-[0.9rem] text-ink-soft">{message}</div>
              ) : null}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
