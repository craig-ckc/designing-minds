/* One place for outbound-call time limits, so no third party (PayFast,
   Mailchimp, Resend, the Vercel deploy hook, DNS) can hold a function open
   until the platform kills it. */

/** Default ceiling for a third-party HTTP call. */
export const DEFAULT_TIMEOUT_MS = 10_000

export class TimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs}ms.`)
    this.name = 'TimeoutError'
  }
}

/** `fetch` that aborts (rejecting with a TimeoutError DOMException) after `timeoutMs`. */
export const fetchWithTimeout = (input: string | URL, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> => {
  const timeout = AbortSignal.timeout(timeoutMs)
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout
  return fetch(input, { ...init, signal })
}

/**
 * Stop WAITING for work that cannot be aborted (an SDK call, a DNS lookup).
 * The underlying operation may still finish in the background; the caller gets
 * a TimeoutError instead of hanging.
 */
export const withTimeout = <T>(work: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, timeoutMs)), timeoutMs)
  })
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer))
}
