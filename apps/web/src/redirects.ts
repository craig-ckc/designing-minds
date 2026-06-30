import type { SlugRedirect } from '@designing-minds/cms'

/* -------------------------------------------------------------------------
   Convert system-managed slug redirects into Vercel Build Output API routes.

   The DB already enforces unique fromPath and fromPath <> toPath and collapses
   chains, but the build re-validates and fails loudly on any duplicate or loop
   so a bad data state can never ship a redirect loop to production.
   ------------------------------------------------------------------------- */

export interface VercelRoute {
  src?: string
  dest?: string
  status?: number
  headers?: Record<string, string>
  handle?: 'filesystem'
  check?: boolean
}

/** Escape a literal path for use as a Vercel route `src` regex (anchored). */
const toSrc = (path: string) => `^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`

/**
 * Throws on a duplicate fromPath or any redirect loop (direct or transitive),
 * naming the conflicting paths. Call before emitting routes.
 */
export function validateRedirects(redirects: SlugRedirect[]): void {
  const map = new Map<string, string>()
  for (const redirect of redirects) {
    if (redirect.fromPath === redirect.toPath) {
      throw new Error(`Redirect loop: fromPath equals toPath (${redirect.fromPath}).`)
    }
    if (map.has(redirect.fromPath)) {
      throw new Error(`Duplicate redirect fromPath: ${redirect.fromPath}.`)
    }
    map.set(redirect.fromPath, redirect.toPath)
  }

  for (const start of map.keys()) {
    const seen = new Set<string>([start])
    let current = map.get(start)
    while (current && map.has(current)) {
      if (seen.has(current)) {
        throw new Error(`Redirect loop detected involving ${[...seen, current].join(' -> ')}.`)
      }
      seen.add(current)
      current = map.get(current)
    }
  }
}

/** Build the permanent-redirect routes (placed before filesystem handling). */
export function redirectRoutes(redirects: SlugRedirect[]): VercelRoute[] {
  return redirects.map((redirect) => ({
    src: toSrc(redirect.fromPath),
    status: redirect.statusCode || 301,
    headers: { Location: redirect.toPath },
  }))
}
