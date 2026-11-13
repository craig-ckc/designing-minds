import { useEffect, useRef, useState } from 'react'
import { apiUrl } from './api'
import { requestJson } from './request-json'

/** One downloadable file of an order line, as /api/order-files lists it. */
export interface OrderFileEntry {
  id: string
  label: string
  productTitle: string
}

interface OrderFilesResponse {
  lines?: { index?: unknown; files?: unknown }[]
}

const isFileEntry = (value: unknown): value is OrderFileEntry => {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return typeof entry.id === 'string' && typeof entry.label === 'string' && typeof entry.productTitle === 'string'
}

/** Line position in `order.items` -> its files. Malformed entries are dropped. */
export function parseOrderFiles(body: OrderFilesResponse | null | undefined): Map<number, OrderFileEntry[]> | null {
  if (!body || !Array.isArray(body.lines)) return null
  const lines = new Map<number, OrderFileEntry[]>()
  for (const line of body.lines) {
    if (!line || typeof line.index !== 'number' || !Number.isInteger(line.index) || !Array.isArray(line.files)) continue
    lines.set(line.index, line.files.filter(isFileEntry))
  }
  return lines
}

/**
 * The files the server says each line of a paid order unlocks — the same rule
 * that authorises the download itself, so renamed, archived or unpublished
 * resources still list. Null until loaded or when the request fails; callers
 * keep their catalogue-based listing as the fallback.
 */
export function useOrderFiles(
  orderId: string | undefined,
  enabled: boolean,
  getAccessToken: () => Promise<string | null>,
): Map<number, OrderFileEntry[]> | null {
  const [state, setState] = useState<{ orderId: string; lines: Map<number, OrderFileEntry[]> } | null>(null)
  const tokenRef = useRef(getAccessToken)
  useEffect(() => { tokenRef.current = getAccessToken }, [getAccessToken])

  useEffect(() => {
    if (!orderId || !enabled) return
    const controller = new AbortController()
    void (async () => {
      try {
        const token = await tokenRef.current()
        if (!token || controller.signal.aborted) return
        const body = await requestJson<OrderFilesResponse>(apiUrl('/api/order-files'), {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId }),
          signal: controller.signal,
        }, fetch, 15_000)
        const lines = parseOrderFiles(body)
        if (lines && !controller.signal.aborted) setState({ orderId, lines })
      } catch {
        // Keep the catalogue-based listing; the download button still asks the server.
      }
    })()
    return () => controller.abort()
  }, [orderId, enabled])

  return state && state.orderId === orderId ? state.lines : null
}
