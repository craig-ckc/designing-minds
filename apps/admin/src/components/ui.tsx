import { type ReactNode } from 'react'
import { CARD, FIELD } from './tokens'

/* -------------------------------------------------------------------------
   Primitive components. Shared class strings (CARD, FIELD, SOLID_BTN, btn)
   live in ./tokens so this file only exports components for Fast Refresh.
   ------------------------------------------------------------------------- */

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 ${className}`}>{children}</div>
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mb-4 inline-block text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted ${className}`}>
      {children}
    </p>
  )
}

export type IconName =
  | 'check'
  | 'arrow'
  | 'cart'
  | 'doc'
  | 'star'
  | 'shield'
  | 'download'
  | 'spark'
  | 'plus'
  | 'chevron'
  | 'grid'
  | 'box'
  | 'receipt'
  | 'users'
  | 'pencil'
  | 'search'
  | 'external'
  | 'rand'
  | 'back'
  | 'filter'
  | 'settings'

export function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    filter: <path d="M3 5h18M6 12h12M10 19h4" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    cart: (
      <>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
      </>
    ),
    doc: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h6" />
      </>
    ),
    star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />,
    spark: <path d="M12 3v6m0 6v6m-9-9h6m6 0h6M6 6l3 3m6 6 3 3M6 18l3-3m6-6 3-3" />,
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </>
    ),
    box: (
      <>
        <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </>
    ),
    receipt: (
      <>
        <path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
      </>
    ),
    pencil: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
    external: (
      <>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <path d="M15 3h6v6M10 14 21 3" />
      </>
    ),
    rand: <path d="M7 4h6a4 4 0 0 1 0 8H7m0 0v8m0-8h4l5 8M7 4v8" />,
    back: <path d="M19 12H5M11 18l-6-6 6-6" />,
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

/* The signature Relume placeholder image block. */
export function Placeholder({
  ratio,
  label,
  circle,
  className = '',
}: {
  ratio?: string
  label?: string
  circle?: boolean
  className?: string
}) {
  return (
    <div
      className={`relative grid place-items-center overflow-hidden bg-ph text-ph-glyph ${
        circle ? 'rounded-full' : 'rounded-[10px]'
      } ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
      aria-hidden="true"
    >
      <svg className="h-11 w-11 opacity-90" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="9" width="36" height="30" rx="3" />
        <circle cx="17" cy="19" r="3.5" />
        <path d="M9 35l10-9 7 6 6-5 7 6" />
      </svg>
      {label ? (
        <span className="absolute bottom-3 left-3 text-[0.72rem] uppercase tracking-[0.08em] text-muted">{label}</span>
      ) : null}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-[0.92rem] font-medium">
      {label}
      {children}
    </label>
  )
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <select className={FIELD} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.04em] text-muted">
      {children}
    </span>
  )
}

/* Page-section heading used at the top of each route. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-[640px]">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2>{title}</h2>
        {description ? <p className="mt-3 text-[1.02rem] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  )
}

/* Monochrome status pill — varies by fill / outline / opacity, never colour. */
export function StatusBadge({ status }: { status: 'Paid' | 'Pending' | 'Refunded' }) {
  const styles: Record<string, string> = {
    Paid: 'border-ink bg-ink text-white',
    Pending: 'border-line-strong bg-surface text-ink',
    Refunded: 'border-line bg-surface-alt text-muted',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.72rem] font-medium uppercase tracking-[0.06em] ${styles[status]}`}
    >
      {status}
    </span>
  )
}

export function SampleNote({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.08em] text-muted ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-muted" />
      Sample data
    </span>
  )
}

/* -------------------------------------------------------------------------
   Table primitives
   ------------------------------------------------------------------------- */

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className={`overflow-hidden ${CARD}`}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`whitespace-nowrap px-3 py-2.5 text-left text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-muted ${className}`}
    >
      {children}
    </th>
  )
}

export function Td({ children, className = '', colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={`whitespace-nowrap px-3 py-3 align-middle text-[0.92rem] ${className}`}>
      {children}
    </td>
  )
}

export function StatePanel({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string
  title: string
  body?: string
  children?: ReactNode
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-5 text-center">
      <div className="grid max-w-[460px] gap-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        {body ? <p className="text-[1.05rem] text-ink-soft">{body}</p> : null}
        {children}
      </div>
    </div>
  )
}
