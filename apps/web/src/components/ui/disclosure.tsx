import { type ComponentPropsWithRef, type ReactNode } from 'react'
import { cn } from '@designing-minds/utils'
import { Icon } from './icon'

/**
 * The `+` that rotates 45° into a `×` when its disclosure opens. Shared by the
 * native `Disclosure` (`group-open`) and the Base UI FAQ accordion
 * (`group-data-[panel-open]`): wrap it in an element with the `group` class.
 */
export function PlusMarker({ className, weight }: { className?: string; weight?: 'regular' | 'bold' }) {
  return (
    <span
      className={cn(
        'transition-transform motion-reduce:transition-none group-open:rotate-45 group-data-[panel-open]:rotate-45',
        className,
      )}
      aria-hidden="true"
    >
      <Icon name="plus" size={16} weight={weight} />
    </span>
  )
}

/**
 * Native `<details>` disclosure. Deliberately JS-free: every panel stays in the
 * prerendered HTML and works before hydration, unlike the Base UI accordion
 * (`FaqAccordion`), which is used where the interactive version earns its weight.
 * Sizes are stock `text-base`/`text-sm` on purpose: `.product-detail` flattens the
 * body tokens to 14px and the heading must stay 16px there. The summary wraps a heading (`as`, default h2) so the outline stays navigable.
 */
export function Disclosure({
  title,
  children,
  as: Heading = 'h2',
  className,
  titleClassName,
  panelClassName,
  ...rest
}: {
  title: ReactNode
  children: ReactNode
  as?: 'h2' | 'h3' | 'h4'
  className?: string
  titleClassName?: string
  panelClassName?: string
} & Omit<ComponentPropsWithRef<'details'>, 'title' | 'className' | 'children'>) {
  return (
    <details {...rest} className={cn('detail-disclosure border-b border-line', className)}>
      <summary className="group flex min-h-12 items-center justify-between gap-4 py-4 text-ink">
        <Heading className={cn('text-base font-semibold leading-snug tracking-normal', titleClassName)}>{title}</Heading>
        <PlusMarker className="flex-none" />
      </summary>
      <div className={cn('pb-5 text-sm leading-relaxed text-ink-soft', panelClassName)}>{children}</div>
    </details>
  )
}
