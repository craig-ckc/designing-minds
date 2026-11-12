import { useEffect, useReducer, useState } from 'react'
import type { PhysicalCatalogVariant } from '@designing-minds/cms'
import { supabase } from './supabase'

type LiveVariant = Pick<PhysicalCatalogVariant, 'id' | 'available'>

/** Refresh the current product's stock flags without replacing its published content. */
export function usePhysicalAvailability(productId: string) {
  const [availableIds, setAvailableIds] = useState<ReadonlySet<string> | null>(null)
  const [checkFailed, setCheckFailed] = useState(false)
  const [attempt, retry] = useReducer((current: number) => current + 1, 0)

  useEffect(() => {
    const client = supabase
    if (!client) return
    let request: AbortController | undefined

    const refresh = async () => {
      request?.abort()
      const controller = new AbortController()
      request = controller
      try {
        const { data, error } = await client
          .from('catalog_physical_products')
          .select('variants')
          .eq('id', productId)
          .abortSignal(AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]))
          .maybeSingle<{ variants: LiveVariant[] }>()
        if (controller.signal.aborted) return
        if (error) throw error
        setAvailableIds(new Set(data?.variants.filter((variant) => variant.available).map((variant) => variant.id)))
        setCheckFailed(false)
      } catch {
        if (!controller.signal.aborted) setCheckFailed(true)
      }
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    void refresh()
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      request?.abort()
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [productId, attempt])

  return { availableIds, checkFailed, retry }
}
