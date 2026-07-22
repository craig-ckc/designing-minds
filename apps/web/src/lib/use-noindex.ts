import { useEffect } from 'react'

/**
 * Marks the current functional page as noindex (sitemap.md: account, cart,
 * checkout, and auth pages must not appear in public search results).
 */
export function useNoindex() {
  useEffect(() => {
    const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const meta = existing ?? document.createElement('meta')
    const previous = existing?.content ?? null
    if (!existing) {
      meta.name = 'robots'
      document.head.appendChild(meta)
    }
    meta.content = 'noindex,nofollow'
    return () => {
      if (previous === null) meta.remove()
      else meta.content = previous
    }
  }, [])
}
