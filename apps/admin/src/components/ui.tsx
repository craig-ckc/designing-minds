import { type ReactNode } from 'react'
import { cn, CARD, TH, TD } from '../design'
import { ScrollArea } from './primitives'

/* -------------------------------------------------------------------------
   Shared page furniture. Interactive controls belong in ./primitives (Base UI
   backed); this file holds the icon set and the few layout pieces the
   dashboard and state screens share. Class strings (CARD, TH, TD…) live in
   ../design so this file only exports components for Fast Refresh.
   ------------------------------------------------------------------------- */

function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`mb-1.5 inline-block text-meta font-semibold uppercase text-muted ${className}`}>
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
  | 'close'
  | 'upload'
  | 'trash'

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
    /* Arrow down into a tray: leaving the app (export, save-to-disk). */
    download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" />,
    /* Arrow up out of a tray: coming into the app (import, file upload). */
    upload: <path d="M12 21V9m0 0 4 4m-4-4-4 4M5 3h14" />,
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
    close: <path d="M18 6 6 18M6 6l12 12" />,
    /* Lid, can, and two score lines — a delete that reads as permanent. */
    trash: (
      <>
        <path d="M4 7h16M10 4h4M9 7v12M15 7v12" />
        <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

/**
 * Page heading for a full-page route (the dashboard, state screens).
 *
 * Renders an <h1>: these pages had no level-one heading at all. The base h1
 * style is already `text-page` (see index.css), so the class here just states
 * that explicitly rather than leaving it implicit.
 */
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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-[640px]">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-page">{title}</h1>
        {description ? <p className="mt-1.5 text-ui text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/* -------------------------------------------------------------------------
   Table primitives
   ------------------------------------------------------------------------- */

/** Card-framed table. Horizontal overflow goes through ScrollArea, like every
 *  other scrollable region in the admin — never a bare overflow utility. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className={`overflow-hidden ${CARD}`}>
      <ScrollArea orientation="horizontal">{children}</ScrollArea>
    </div>
  )
}

/** Sentence-case, 12px semibold — not the old uppercase micro-caps head. */
export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <th className={cn(TH, className)}>{children}</th>
}

export function Td({ children, className = '', colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn(TD, className)}>
      {children}
    </td>
  )
}

/**
 * The admin's one loading screen.
 *
 * Booting used to be told as two headlines — "Checking access…" then
 * "Preparing the workspace…" — which read as two separate waits for what is
 * really one, and at display size for a step nobody needs announced. This is a
 * single screen for the whole boot: a moving mark that says work is happening,
 * and a small label instead of a paragraph.
 */
export function LoadingScreen({ label = 'Loading the workspace' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="grid min-h-screen place-items-center px-5">
      <div className="grid justify-items-center gap-2.5">
        <Spinner />
        <p className="text-title font-semibold text-ink-soft">{label}</p>
      </div>
    </div>
  )
}

/** Indeterminate progress ring. Static for anyone who asked for less motion. */
export function Spinner({ className = 'size-6 text-primary' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`animate-spin motion-reduce:animate-none ${className}`}>
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path
        d="M21.5 12A9.5 9.5 0 0 0 12 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
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
      <div className="grid max-w-[460px] gap-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-page">{title}</h1>
        {body ? <p className="text-ui text-ink-soft">{body}</p> : null}
        {children}
      </div>
    </div>
  )
}
