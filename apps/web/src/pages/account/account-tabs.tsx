import { NavLink } from 'react-router-dom'
import { cn } from '@designing-minds/utils'

const TABS = [
  { to: '/account', label: 'Dashboard', end: true },
  { to: '/account/orders', label: 'Order history', end: false },
  { to: '/help', label: 'Support', end: false },
]

/** Account section tabs (code twin of Figma's AccountTabs). The active tab is underlined in `primary`. */
export function AccountTabs() {
  return (
    <nav aria-label="Account" className="flex gap-6 overflow-x-auto border-b border-line">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              '-mb-px whitespace-nowrap border-b-2 py-3 text-label font-semibold transition-colors',
              isActive ? 'border-primary text-ink' : 'border-transparent text-muted hover:text-ink',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
