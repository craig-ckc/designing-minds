import { checkout } from './handlers/checkout.ts'
import { paymentWebhook } from './handlers/payment-webhook.ts'
import { issueDownload } from './handlers/issue-download.ts'
import type { Handler } from './lib/http.ts'

/**
 * Shared serverless handlers, kept in their own app so both the web and admin
 * front-ends call the same logic instead of duplicating it. Deploy each as a
 * Supabase Edge Function (or any serverless route).
 */
export const handlers: Record<string, Handler> = {
  '/checkout': checkout,
  '/payment-webhook': paymentWebhook,
  '/issue-download': issueDownload,
}

export { checkout, paymentWebhook, issueDownload }
export type { Handler, HandlerRequest, HandlerResponse } from './lib/http.ts'
