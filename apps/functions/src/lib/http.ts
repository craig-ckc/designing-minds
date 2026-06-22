/* Framework-agnostic request/response shapes so handlers can deploy to
   Supabase Edge Functions, a Node server, or any serverless host. */

export interface HandlerRequest {
  method: string
  /** Parsed JSON body, if any. */
  body: unknown
  headers: Record<string, string | undefined>
}

export interface HandlerResponse {
  status: number
  body: unknown
}

export type Handler = (req: HandlerRequest) => Promise<HandlerResponse>

export const ok = (body: unknown): HandlerResponse => ({ status: 200, body })
export const created = (body: unknown): HandlerResponse => ({ status: 201, body })
export const badRequest = (message: string): HandlerResponse => ({ status: 400, body: { error: message } })
export const unauthorized = (message: string): HandlerResponse => ({ status: 401, body: { error: message } })
export const notFound = (message: string): HandlerResponse => ({ status: 404, body: { error: message } })
