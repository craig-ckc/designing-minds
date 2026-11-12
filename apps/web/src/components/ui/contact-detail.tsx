import { type ReactNode } from 'react'

/** One contact row: muted label over a heading-weight value, with an optional action on the right
 *  (code twin of Figma's ContactDetail). Rows sit inside a bordered surface panel. */
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
    <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="text-label uppercase tracking-[0.1em] text-muted">{label}</p>
        <p className="break-words text-h6 text-ink">{value}</p>
      </div>
      {action ? (
        <a href={action.href} className="flex-none text-label font-semibold text-primary-ink underline underline-offset-4">
          {action.label}
        </a>
      ) : null}
    </div>
  )
}
