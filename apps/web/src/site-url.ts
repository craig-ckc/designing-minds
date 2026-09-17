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

/** Route Supabase password-reset emails land on after the user clicks the link. */
export const PASSWORD_RESET_PATH = '/reset-password'

/**
 * Resolve the `redirectTo` URL for Supabase password-reset emails.
 *
 * Only the canonical storefront origin and local development origins may appear
 * in the email link. Preview hostnames, the apex alternate, or a bad value fall
 * back to the canonical origin so the link matches the Supabase redirect
 * allowlist instead of stranding the user on a blocked URL.
 */
export function resolvePasswordResetRedirectUrl(currentOrigin?: string): string {
  if (currentOrigin?.trim()) {
    try {
      const url = new URL(currentOrigin)
      const hostname = url.hostname.replace(/^\[(.*)\]$/, '$1')
      const isAllowlistedLocalOrigin =
        url.protocol === 'http:' &&
        (hostname === 'localhost' || hostname === '127.0.0.1') &&
        (url.port === '3000' || url.port === '5173')
      if (isAllowlistedLocalOrigin) {
        return `${url.origin}${PASSWORD_RESET_PATH}`
      }
    } catch {
      // Fall through to the known-good public origin.
    }
  }

  return `${CANONICAL_SITE_URL}${PASSWORD_RESET_PATH}`
}
