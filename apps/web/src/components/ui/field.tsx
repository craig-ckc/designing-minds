import { type ReactNode } from 'react'

/**
 * Labelled form field. The label wraps the control, so any `<input>`,
 * `<textarea>` or `Select` passed as children is associated without ids.
 * `description` is helper text; `error` is shown in danger colour and announced
 * (`role="alert"`) when it appears — render it only while the field is invalid.
 */
export function Field({ label, description, error, children }: {
  label: ReactNode
  description?: ReactNode
  error?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="grid gap-2 text-body font-medium">
      <span>{label}</span>
      {children}
      {description ? <span className="text-label font-normal text-muted">{description}</span> : null}
      {error ? <span role="alert" className="text-label font-normal text-danger">{error}</span> : null}
    </label>
  )
}
