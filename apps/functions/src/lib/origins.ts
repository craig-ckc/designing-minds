/* Public origins used to build the absolute URLs we hand to third parties. */

const normalise = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, '')
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
}

// Storefront origin — where PayFast sends the shopper back (return/cancel URLs)
// and where unsubscribe links land.
export const siteUrl = (): string => {
  const configured = process.env.SITE_URL
  if (!configured) throw new Error('SITE_URL must be set for checkout URLs.')
  return normalise(configured)
}

// Origin PayFast's *server* calls for the ITN (notify_url). This must reach the
// functions deployment directly. Routing it through the web project's /api/*
// proxy puts a Vercel hop between PayFast and the webhook, so the source IP the
// webhook sees is the proxy's, not PayFast's, and the ITN is rejected. Falls
// back to SITE_URL so local dev (Vite proxies /api/* to this app) and
// single-origin setups keep working without extra configuration.
export const apiOrigin = (): string => {
  const configured = process.env.API_PUBLIC_ORIGIN
  return configured ? normalise(configured) : siteUrl()
}
