import { promotionsCron } from './handlers/promotions-cron.ts'
import { diagnostics } from './handlers/diagnostics.ts'
import { checkout, checkoutQuote } from './handlers/checkout.ts'
import { paymentWebhook } from './handlers/payment-webhook.ts'
import { adminOrderFulfillment, commerceCancel, commerceCheckout, commercePaymentSimulate, commerceQuote } from './handlers/commerce.ts'
import { issueDownload } from './handlers/issue-download.ts'
import { orderFiles } from './handlers/order-files.ts'
import { adminUploadUrl } from './handlers/admin-upload-url.ts'
import { adminRebuildWeb } from './handlers/admin-rebuild-web.ts'
import { adminPublishStatus } from './handlers/admin-publish-status.ts'
import { forms } from './handlers/forms.ts'
import { unsubscribe } from './handlers/unsubscribe.ts'
import type { Handler } from './lib/http.ts'

/**
 * Shared serverless handlers, kept in their own app so both the web and admin
 * front-ends call the same logic instead of duplicating it. Vercel API route
 * files are thin adapters over this map.
 */
export const handlers: Record<string, Handler> = {
  '/diagnostics': diagnostics,
  '/checkout': checkout,
  '/checkout-quote': checkoutQuote,
  '/commerce/quote': commerceQuote,
  '/commerce/checkout': commerceCheckout,
  '/commerce/cancel': commerceCancel,
  '/commerce/payment/simulate': commercePaymentSimulate,
  '/cron/promotions': promotionsCron,
  '/payment-webhook': paymentWebhook,
  '/issue-download': issueDownload,
  '/order-files': orderFiles,
  '/forms': forms,
  '/unsubscribe': unsubscribe,
  '/admin/upload-url': adminUploadUrl,
  '/admin/rebuild-web': adminRebuildWeb,
  '/admin/publish-status': adminPublishStatus,
  '/admin/order-fulfillment': adminOrderFulfillment,
}

export { checkout, paymentWebhook, issueDownload, orderFiles, forms, unsubscribe, adminUploadUrl, adminRebuildWeb, adminPublishStatus, commerceQuote, commerceCheckout, commerceCancel, commercePaymentSimulate, adminOrderFulfillment }
export type { Handler, HandlerRequest, HandlerResponse } from './lib/http.ts'
