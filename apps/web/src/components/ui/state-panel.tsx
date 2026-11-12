import { type ReactNode } from 'react'
import { Icon } from './icon'

type StatePanelTone = 'default' | 'loading' | 'error'

/**
 * Full-page state: loading, failure, sign-in required, empty route.
 *
 * - `tone="loading"` shows a spinner and announces politely (`role="status"`).
 * - `tone="error"` announces assertively (`role="alert"`).
 * - `action` is the recovery step — a "Reload page" / "Try again" / "Log in"
 *   Button. Give every error panel one. `children` is a legacy alias.
 */
export function StatePanel({
  title,
  body,
  action,
  children,
  tone = 'default',
  as: Heading = 'h1',
}: {
  title: string
  body?: string
  action?: ReactNode
  children?: ReactNode
  tone?: StatePanelTone
  as?: 'h1' | 'h2'
}) {
  const role = tone === 'loading' ? 'status' : tone === 'error' ? 'alert' : undefined
  return (
    <div className="grid min-h-[60vh] place-items-center px-5 text-center" role={role} aria-busy={tone === 'loading' || undefined}>
      <div className="grid max-w-form justify-items-center gap-4">
        {tone === 'loading' ? (
          <span className="h-8 w-8 text-ink-soft" aria-hidden="true">
            <Icon name="spinner" className="animate-spin motion-reduce:animate-none" />
          </span>
        ) : null}
        <Heading className="text-h2">{title}</Heading>
        {body ? <p className="lead">{body}</p> : null}
        {action ?? children}
      </div>
    </div>
  )
}
