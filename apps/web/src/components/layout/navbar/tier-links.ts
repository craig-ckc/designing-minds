import type { BundleTier } from '@designing-minds/cms'

/** Filtered /packages link for a tier. */
export function tierHref(tier: BundleTier): string {
  const offer = tier.scope === 'Full Year' ? 'Full-year bundles' : 'Term bundles'
  return `/packages?offer=${encodeURIComponent(offer)}`
}

/** Default description line for a tier (the mobile sheet omits it). */
export function tierDescription(tier: BundleTier): string {
  return tier.featured
    ? `Choose from ${tier.gradeCount} grades.`
    : `Choose from ${tier.gradeCount} grades, any term.`
}
