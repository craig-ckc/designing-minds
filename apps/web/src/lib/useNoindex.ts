import { useEffect } from 'react'

/**
 * Marks the current functional page as noindex (sitemap.md: account, cart,
 * checkout, and auth pages must not appear in public search results).
 */
export function useNoindex() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => {
      document.head.removeChild(meta)
    }
  }, [])
}
