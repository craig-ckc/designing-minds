/* -------------------------------------------------------------------------
   Shared Tailwind class strings — mirrored from the public web app so the
   admin matches the Relume-style monochrome wireframe aesthetic exactly.
   Kept in a non-component module so React Fast Refresh stays happy.
   ------------------------------------------------------------------------- */

export const CARD = 'rounded-[10px] border border-line bg-surface'
export const FIELD =
  'w-full min-h-[46px] rounded-md border border-line-strong bg-surface px-3.5 py-2.5 focus:outline focus:outline-2 focus:outline-ink focus:-outline-offset-1'

/* The one solid button — primary actions like Save. */
export const SOLID_BTN =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-md border-[1.5px] border-ink bg-ink px-[22px] text-[0.97rem] font-medium text-white transition hover:opacity-85 disabled:opacity-50'

/* Pure-text buttons / links everywhere else. */
export function btn(variant: 'solid' | 'ghost' | 'light' | 'outline-light' = 'solid', extra = '') {
  const base =
    'inline-flex items-center justify-center gap-2 text-[0.97rem] font-medium underline underline-offset-4 transition hover:opacity-70 disabled:opacity-50'
  const tone = variant === 'light' || variant === 'outline-light' ? 'text-white' : 'text-ink'
  return `${base} ${tone} ${extra}`
}
