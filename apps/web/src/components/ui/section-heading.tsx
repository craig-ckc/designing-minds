import { type ReactNode } from 'react'
import { cn } from '@designing-minds/utils'

type HeadingLevel = 'h1' | 'h2' | 'h3'

/**
 * Title (+ optional lead and actions) block that opens a section.
 *
 * - `align="center"` (default): the marketing convention — centred title and
 *   lead in a `max-w-prose` column; `actions` sit below the lead.
 * - `align="start"`: catalogue/detail headers — title block on the left,
 *   `actions` (e.g. a "See all" Button) on the right, wrapping on narrow screens.
 *
 * No eyebrow label by design. Pass `className` to change the bottom margin.
 */
export function SectionHeading({
  title,
  lead,
  actions,
  align = 'center',
  as: Heading = 'h2',
  id,
  className,
}: {
  title: ReactNode
  lead?: ReactNode
  actions?: ReactNode
  align?: 'center' | 'start'
  as?: HeadingLevel
  id?: string
  className?: string
}) {
  if (align === 'start') {
    return (
      <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
        <div className="min-w-0">
          <Heading id={id}>{title}</Heading>
          {lead ? <p className="lead mt-3">{lead}</p> : null}
        </div>
        {actions}
      </div>
    )
  }
  return (
    <div className={cn('mx-auto mb-10 max-w-prose text-center lg:mb-14', className)}>
      <Heading id={id}>{title}</Heading>
      {lead ? <p className="lead mt-4">{lead}</p> : null}
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  )
}
