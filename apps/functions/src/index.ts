import { checkout } from './handlers/checkout.ts'
import { paymentWebhook } from './handlers/payment-webhook.ts'
import { issueDownload } from './handlers/issue-download.ts'
import { adminUploadUrl } from './handlers/admin-upload-url.ts'
import type { Handler } from './lib/http.ts'

/**
 * Shared serverless handlers, kept in their own app so both the web and admin
 * front-ends call the same logic instead of duplicating it. Vercel API route
 * files are thin adapters over this map.
 */
export const handlers: Record<string, Handler> = {
  '/checkout': checkout,
  '/payment-webhook': paymentWebhook,
  '/issue-download': issueDownload,
  '/admin/upload-url': adminUploadUrl,
}

export { checkout, paymentWebhook, issueDownload, adminUploadUrl }
export type { Handler, HandlerRequest, HandlerResponse } from './lib/http.ts'
