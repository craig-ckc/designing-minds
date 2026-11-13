import { type ReactNode } from 'react'
import { Icon, type IconName } from './icon'

/** A quiet empty state: one heading, a reason and the next useful action.
 *  Same `action` slot as `StatePanel`; `children` is a legacy alias for it. */
export function EmptyState({ title, description, icon, action, children, as: Heading = 'h2' }: {
  title: string
  description: string
  icon: IconName
  action?: ReactNode
  children?: ReactNode
  as?: 'h1' | 'h2'
}) {
  const next = action ?? children
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true"><Icon name={icon} size={28} /></span>
      <Heading className="text-h3 font-bold leading-[1.2]">{title}</Heading>
      <p className="mt-3 max-w-[38ch] text-body text-ink-soft">{description}</p>
      {next ? <div className="mt-5">{next}</div> : null}
    </div>
  )
}
