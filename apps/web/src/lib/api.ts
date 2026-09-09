// Vite and the production Build Output both proxy /api/* to functions.
// Always use that proxy: a stale VITE_API_BASE_URL bypassed it and broke
// checkout when the canonical storefront changed from apex to www.
export const apiUrl = (path: string) => `/${path.replace(/^\/+/, '')}`
