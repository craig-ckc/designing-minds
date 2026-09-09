import { diagnosticId } from '../../../../packages/utils/src/diagnostics.ts'

export class RequestError extends Error {
  requestId: string
  constructor(message: string, requestId: string) {
    super(message)
    this.name = 'RequestError'
    this.requestId = requestId
  }
}

/** Single attempt: an ambiguous timeout must never replay a payment mutation. */
export async function requestJson<T>(url: string, init: RequestInit, send: typeof fetch = fetch, timeoutMs = 30_000): Promise<T> {
  const headers = new Headers(init.headers)
  let requestId = diagnosticId(headers.get('x-request-id')) ?? crypto.randomUUID()
  headers.set('x-request-id', requestId)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs)
  try {
    const response = await send(url, { ...init, headers, signal: init.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal })
    requestId = diagnosticId(response.headers.get('x-request-id')) ?? requestId
    const body: unknown = await response.json().catch(() => null)
    if (response.status === 401) throw new RequestError('Your session has expired. Please sign in again.', requestId)
    if (!response.ok) {
      const message = response.status < 500 && body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error : 'The service is temporarily unavailable. Please try again shortly.'
      throw new RequestError(message, requestId)
    }
    if (!body || typeof body !== 'object') throw new RequestError('The service returned an unexpected response. Please contact support.', requestId)
    return body as T
  } catch (error) {
    if (error instanceof RequestError) throw error
    if (controller.signal.aborted) throw new RequestError('This is taking longer than expected. Check your order history before trying again.', requestId)
    throw new RequestError('We could not reach the service. Check your connection. If this continues, contact support.', requestId)
  } finally { clearTimeout(timer) }
}
