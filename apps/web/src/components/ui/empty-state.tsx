import { type ReactNode } from 'react'
import { Icon, type IconName } from './icon'

/** A quiet empty state: one heading, a reason and the next useful action. */
export function EmptyState({ title, description, icon, children, as: Heading = 'h2' }: {
  title: string
  description: string
  icon: IconName
  children: ReactNode
  as?: 'h1' | 'h2'
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true"><Icon name={icon} size={28} /></span>
      <Heading className="text-2xl">{title}</Heading>
      <p className="mt-3 max-w-[38ch] text-body text-ink-soft">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  )
}
