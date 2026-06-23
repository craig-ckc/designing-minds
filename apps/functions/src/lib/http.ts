/* Framework-agnostic request/response shapes so handlers can deploy through
   Vercel API routes, a Node dev server, or another serverless host. */

export interface HandlerRequest {
  method: string
  /** Parsed JSON body, if any. */
  body: unknown
  rawBody?: string
  headers: Record<string, string | undefined>
}

export interface HandlerResponse {
  status: number
  body: unknown
  headers?: Record<string, string>
}

export type Handler = (req: HandlerRequest) => Promise<HandlerResponse>

export const ok = (body: unknown): HandlerResponse => ({ status: 200, body })
export const created = (body: unknown): HandlerResponse => ({ status: 201, body })
export const badRequest = (message: string): HandlerResponse => ({ status: 400, body: { error: message } })
export const unauthorized = (message: string): HandlerResponse => ({ status: 401, body: { error: message } })
export const forbidden = (message: string): HandlerResponse => ({ status: 403, body: { error: message } })
export const notFound = (message: string): HandlerResponse => ({ status: 404, body: { error: message } })
export const serverError = (message: string): HandlerResponse => ({ status: 500, body: { error: message } })
