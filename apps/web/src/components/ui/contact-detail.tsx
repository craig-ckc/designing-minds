import { type ReactNode } from 'react'
import { TextLink } from './text-link'

/** One contact row: muted label over a heading-weight value, with an optional action on the right
 *  (code twin of Figma's ContactDetail). Rows sit inside a bordered surface panel whose side
 *  padding insets the dividers. */
export function ContactDetail({
  label,
  value,
  action,
}: {
  label: string
  value: string
  action?: { label: string; href: string }
}): ReactNode {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="text-caption uppercase text-muted">{label}</p>
        <p className="break-words text-h6 text-ink">{value}</p>
      </div>
      {action ? (
        <TextLink href={action.href} tone="brand" className="flex-none text-body">
          {action.label}
        </TextLink>
      ) : null}
    </div>
  )
}
