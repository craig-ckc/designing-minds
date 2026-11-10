import { Button } from './primitives/Button'

/** Persistent live regions announce changing feedback without moving focus. */
export function FeedbackMessages({ message, error, onDismissError }: {
  message: string | null
  error: string | null
  onDismissError?: () => void
}) {
  const notice = 'pointer-events-auto rounded-control border px-3 py-2 text-ui shadow-popup'
  return (
    <div className={`pointer-events-none relative z-20 flex-none dense:absolute dense:bottom-3 dense:right-3 dense:max-w-sm ${message || error ? 'border-t border-line bg-surface p-3 dense:border-0 dense:bg-transparent dense:p-0' : ''}`}>
      <div role="status" aria-atomic="true">
        {message && !error ? <div className={`${notice} border-line bg-surface text-ink-soft`}>{message}</div> : null}
      </div>
      <div role="alert" aria-atomic="true">
        {error ? (
          <div className={`${notice} flex items-start gap-3 border-danger bg-danger-tint text-danger`}>
            <span className="min-w-0 flex-1 break-words">{error}</span>
            {onDismissError ? (
              <Button variant="text" onClick={onDismissError} aria-label="Dismiss error" className="shrink-0 text-danger">
                Dismiss
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
