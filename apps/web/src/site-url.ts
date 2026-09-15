/**
 * The public storefront origin used by every indexable URL.
 *
 * Canonical URLs must not inherit a preview hostname, localhost, or the apex
 * alternate because those values describe a different URL origin to crawlers.
 */
export const CANONICAL_SITE_URL = 'https://www.designingminds.co.za'

/**
 * Resolve the configured site URL to the one origin that may appear in public
 * metadata. A bad build-time value must never ship a cross-origin canonical.
 */
export function resolveCanonicalSiteUrl(configuredSiteUrl?: string): string {
  if (configuredSiteUrl?.trim()) {
    try {
      const configured = new URL(configuredSiteUrl)
      if (configured.origin === CANONICAL_SITE_URL) return CANONICAL_SITE_URL
    } catch {
      // Fall through to the known-good public origin.
    }
  }

  return CANONICAL_SITE_URL
}

export function canonicalUrlForPath(path: string, configuredSiteUrl?: string): string {
  return `${resolveCanonicalSiteUrl(configuredSiteUrl)}${path === '/' ? '/' : path}`
}
