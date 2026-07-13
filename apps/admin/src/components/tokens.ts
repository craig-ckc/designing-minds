/* -------------------------------------------------------------------------
   Shared Tailwind class strings — mirrored from the public web app so the
   admin carries the same brand: warm neutrals, generous radii, and the
   brand-pink primary button. Kept in a non-component module so React Fast
   Refresh stays happy.
   ------------------------------------------------------------------------- */

export const CARD = 'rounded-card border border-line bg-surface'
export const FIELD =
  'w-full min-h-[36px] rounded-control border border-line-strong bg-surface px-3 py-1.5 transition placeholder:text-muted focus:border-primary focus:outline focus:outline-2 focus:outline-primary/25 focus:-outline-offset-1'

/* The one solid button — primary actions like Save. Brand-pink gradient. */
export const SOLID_BTN =
  'inline-flex min-h-[38px] items-center justify-center gap-2 rounded-control border border-primary-edge px-5 text-[0.9rem] font-semibold text-on-primary transition [background-image:var(--gradient-primary)] hover:[background-image:var(--gradient-primary-hover)] disabled:opacity-50'

/* Quiet inline text action (no underline — underlines read as web links,
   not admin controls). Prefer the Button primitive's soft/outline/ghost. */
export function btn(variant: 'solid' | 'ghost' | 'light' | 'outline-light' = 'solid', extra = '') {
  const base =
    'inline-flex items-center justify-center gap-2 text-[0.97rem] font-medium transition hover:opacity-70 disabled:opacity-50'
  const tone = variant === 'light' || variant === 'outline-light' ? 'text-white' : 'text-ink'
  return `${base} ${tone} ${extra}`
}
