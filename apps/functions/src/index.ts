import { checkout } from './handlers/checkout.ts'
import { paymentWebhook } from './handlers/payment-webhook.ts'
import { issueDownload } from './handlers/issue-download.ts'
import { adminUploadUrl } from './handlers/admin-upload-url.ts'
import { adminRebuildWeb } from './handlers/admin-rebuild-web.ts'
import { fakePayfastComplete } from './handlers/fake-payfast-complete.ts'
import { forms } from './handlers/forms.ts'
import type { Handler } from './lib/http.ts'

/**
 * Shared serverless handlers, kept in their own app so both the web and admin
 * front-ends call the same logic instead of duplicating it. Vercel API route
 * files are thin adapters over this map.
 */
export const handlers: Record<string, Handler> = {
  '/checkout': checkout,
  '/payment-webhook': paymentWebhook,
  '/fake-payfast/complete': fakePayfastComplete,
  '/issue-download': issueDownload,
  '/forms': forms,
  '/admin/upload-url': adminUploadUrl,
  '/admin/rebuild-web': adminRebuildWeb,
}

export { checkout, paymentWebhook, fakePayfastComplete, issueDownload, forms, adminUploadUrl, adminRebuildWeb }
export type { Handler, HandlerRequest, HandlerResponse } from './lib/http.ts'
