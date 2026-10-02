import { logEvent } from '../lib/diagnostics.ts'
import { badRequest, created, ok, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { createServiceClient } from '../lib/supabase.ts'
import { requireUser } from '../lib/auth.ts'
import { formatPayfastAmount, toCents } from '../lib/money.ts'
import { buildPayfastProcess, payfastCredentials } from '../lib/payfast.ts'
import { apiOrigin, siteUrl } from '../lib/origins.ts'

interface CheckoutInput {
  items: { productSlug: string }[]
  expectedTotalZar?: number
  couponCode?: string
  acceptedTerms?: unknown
}
interface CheckoutQuote {
  orderId: string
  paymentId: string
  reference: string
  items: unknown[]
  subtotalZar: number
  discountZar: number
  totalZar: number
  couponCode: string | null
}
function isCheckoutInput(value: unknown): value is CheckoutInput {
  if (typeof value !== 'object' || value === null) return false
  const body = value as CheckoutInput
  return Array.isArray(body.items) && body.items.length <= 200 &&
    body.items.every((item) => typeof item?.productSlug === 'string' && item.productSlug.length > 0 && item.productSlug.length <= 200) &&
    (body.expectedTotalZar === undefined || (typeof body.expectedTotalZar === 'number' && Number.isFinite(body.expectedTotalZar) && body.expectedTotalZar > 0)) &&
    (body.couponCode === undefined || (typeof body.couponCode === 'string' && body.couponCode.length <= 40))
}
const orderReference = () => `DM-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

// Both preview and payment use database pricing. No browser-supplied price,
// discount or customer identity participates in the calculation.
function checkoutHandler(preview: boolean): Handler {
  return async (req) => {
    if (req.method !== 'POST') return badRequest('Use POST.')
    if (!isCheckoutInput(req.body)) return badRequest('Expected cart items and an optional discount code of at most 40 characters.')
    if (req.body.items.length === 0) return badRequest('Cart is empty.')
    if (!preview && req.body.acceptedTerms !== true) return badRequest('You must agree to the Terms of Use before checkout.')
    let user
    try {
      logEvent('checkout.auth')
      user = await requireUser(req.headers)
    } catch (error) {
      return unauthorized(error instanceof Error ? error.message : 'Authentication required.')
    }
    try {
      // Configuration must be valid before a coupon or payment is reserved.
      logEvent('checkout.configuration')
      const configuration = preview ? null : { baseUrl: siteUrl(), notifyOrigin: apiOrigin(), ...payfastCredentials() }
      const supabase = createServiceClient()
      const args = {
        p_customer_id: user.id,
        p_slugs: [...new Set(req.body.items.map((item) => item.productSlug))],
        p_coupon_code: req.body.couponCode?.trim() || null,
      }
      logEvent('checkout.catalogue')
      const { data, error } = preview
        ? await supabase.rpc('quote_promotional_order', args)
        : await supabase.rpc('create_promotional_order', { ...args, p_reference: orderReference(), p_expected_total_zar: req.body.expectedTotalZar ?? null })
      if (error?.code === 'P0001') return badRequest(error.message)
      if (error) throw error
      const quote = data as CheckoutQuote
      if (preview) return ok(quote)
      if (!configuration || !quote?.orderId || !quote.paymentId || toCents(quote.totalZar) <= 0) throw new Error('Invalid checkout quote.')
      const { data: customer, error: customerError } = await supabase.from('users').select('name,email').eq('id', user.id).single<{ name: string; email: string }>()
      if (customerError || !customer) throw customerError ?? new Error('Customer account not found.')
      const { orderId, paymentId, reference } = quote
      logEvent('checkout.order.created', { orderId })
      const payfast = buildPayfastProcess({
        merchant_id: configuration.merchantId,
        merchant_key: configuration.merchantKey,
        return_url: `${configuration.baseUrl}/checkout/return?order=${orderId}`,
        cancel_url: `${configuration.baseUrl}/checkout/cancel?order=${orderId}`,
        notify_url: `${configuration.notifyOrigin}/api/payment-webhook`,
        name_first: customer.name.split(/\s+/)[0] ?? customer.name,
        email_address: customer.email,
        m_payment_id: paymentId,
        amount: formatPayfastAmount(toCents(quote.totalZar)),
        item_name: `Designing Minds ${reference}`,
        item_description: `${quote.items?.length ?? req.body.items.length} digital resources`,
      })
      return created({ ...quote, payfast })
    } catch (error) {
      logEvent('checkout.failed', { errorKind: error instanceof Error ? error.name : 'Error', code: error && typeof error === 'object' && 'code' in error ? error.code : undefined })
      return serverError(preview ? 'Unable to check prices.' : 'Unable to start checkout.')
    }
  }
}
export const checkout = checkoutHandler(false)
export const checkoutQuote = checkoutHandler(true)
