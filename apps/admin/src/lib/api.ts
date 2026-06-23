const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export const apiUrl = (path: string) => `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`

