import { createClient } from '@supabase/supabase-js'
import type { CommerceCheckoutInput, CommerceCheckoutResponse, CommerceInput, CommerceQuote, DeliveryDetails, PhysicalCartLine } from '@designing-minds/cms'
// The functions dev server executes raw TypeScript without a bundler. Import
// the pure subpath rather than loading the browser CMS entrypoint.
import { deliveryValidation, quantityValidation } from '@designing-minds/cms/commerce'
import { requireAdmin, requireUser } from '../lib/auth.ts'
import { adminAuthFailure } from '../lib/auth-errors.ts'
import { logEvent } from '../lib/diagnostics.ts'
import { badRequest, created, forbidden, notFound, ok, serverError, unauthorized, type Handler, type HandlerResponse } from '../lib/http.ts'
import { formatPayfastAmount, toCents } from '../lib/money.ts'
import { apiOrigin, siteUrl } from '../lib/origins.ts'
import { buildPayfastProcess, payfastCredentials } from '../lib/payfast.ts'
import { createServiceClient } from '../lib/supabase.ts'

interface CommerceContext { enabled: boolean; localPreview: boolean }
const MAX_LINES = 200
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const boundedString = (value: unknown, max: number, required = false): value is string => typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0)

function validDelivery(value: unknown): value is DeliveryDetails {
  if (!isRecord(value)) return false
  return boundedString(value.recipientName, 200, true) && boundedString(value.phone, 40, true) &&
    boundedString(value.addressLine1, 200, true) && (value.addressLine2 === undefined || boundedString(value.addressLine2, 200)) &&
    boundedString(value.suburb, 200, true) && boundedString(value.city, 200, true) &&
    boundedString(value.province, 100, true) && boundedString(value.postalCode, 20, true) && value.country === 'ZA'
}

function validPhysicalLine(value: unknown): value is PhysicalCartLine {
  if (!isRecord(value) || typeof value.id !== 'string' || !UUID_RE.test(value.id) || !boundedString(value.productSlug, 200, true) ||
    typeof value.variantId !== 'string' || !UUID_RE.test(value.variantId) || quantityValidation(value.quantity) !== null ||
    !isRecord(value.customizations) || Object.keys(value.customizations).length > 20) return false
  return Object.entries(value.customizations).every(([key, text]) => boundedString(key, 100, true) && boundedString(text, 200))
}

function validCommerceInput(value: unknown): value is CommerceInput {
  if (!isRecord(value) || !Array.isArray(value.digitalSlugs) || !Array.isArray(value.physicalItems) ||
    value.digitalSlugs.length + value.physicalItems.length > MAX_LINES ||
    !value.digitalSlugs.every((slug) => boundedString(slug, 200, true)) ||
    !value.physicalItems.every(validPhysicalLine)) return false
  if (value.couponCode !== undefined && !boundedString(value.couponCode, 40)) return false
  if (value.delivery !== undefined && value.delivery !== null && !validDelivery(value.delivery)) return false
  if (value.shippingOptionId !== undefined && value.shippingOptionId !== null && !boundedString(value.shippingOptionId, 100)) return false
  return value.digitalSlugs.length + value.physicalItems.length > 0
}

function validCheckoutInput(value: unknown): value is CommerceCheckoutInput {
  if (!isRecord(value) || !validCommerceInput(value)) return false
  const checkout = value as unknown as Record<string, unknown>
  return checkout.acceptedTerms === true && typeof checkout.expectedTotalZar === 'number' &&
    Number.isFinite(checkout.expectedTotalZar) && checkout.expectedTotalZar > 0
}

const orderReference = () => `DM-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

export async function getCommerceContext(): Promise<CommerceContext> {
  const { data, error } = await createServiceClient().from('commerce_public_context').select('enabled,localPreview').single<CommerceContext>()
  if (error || !data || typeof data.enabled !== 'boolean' || typeof data.localPreview !== 'boolean') throw error ?? new Error('Commerce context unavailable.')
  return data
}

const rpcBusinessError = (error: { code?: string; message?: string } | null | undefined): HandlerResponse | null =>
  error?.code === 'P0001' ? badRequest(error.message ?? 'The cart could not be processed.') : null

function quoteArgs(userId: string, input: CommerceInput) {
  return {
    p_customer_id: userId,
    p_digital_slugs: input.digitalSlugs,
    p_physical_items: input.physicalItems,
    p_coupon_code: input.couponCode?.trim() || null,
    p_delivery: input.delivery ?? null,
    p_shipping_option_id: input.shippingOptionId ?? null,
  }
}

export const commerceQuote: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!validCommerceInput(req.body)) return badRequest('Expected up to 200 digital or physical cart lines with valid item details.')
  let user
  try { user = await requireUser(req.headers) }
  catch (error) { return unauthorized(error instanceof Error ? error.message : 'Authentication required.') }
  try {
    const context = await getCommerceContext()
    if (req.body.physicalItems.length && !context.enabled) return forbidden('Physical checkout is currently unavailable.')
    if (req.body.physicalItems.length && req.body.delivery) {
      const deliveryError = deliveryValidation(req.body.delivery)
      if (deliveryError) return badRequest(deliveryError)
    }
    const { data, error } = await createServiceClient().rpc('quote_commerce_order', quoteArgs(user.id, req.body))
    const businessError = rpcBusinessError(error)
    if (businessError) return businessError
    if (error) throw error
    return ok(data as CommerceQuote)
  } catch (error) {
    logEvent('checkout.failed', { errorKind: error instanceof Error ? error.name : 'Error' })
    return serverError('Unable to check cart prices.')
  }
}

export const commerceCheckout: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!validCheckoutInput(req.body)) return badRequest('Expected cart items, accepted terms, and a positive expected total.')
  if (req.body.physicalItems.length) {
    if (!req.body.delivery) return badRequest('Enter delivery details before checkout.')
    const deliveryError = deliveryValidation(req.body.delivery)
    if (deliveryError) return badRequest(deliveryError)
  }
  let user
  try { user = await requireUser(req.headers) }
  catch (error) { return unauthorized(error instanceof Error ? error.message : 'Authentication required.') }

  try {
    const context = await getCommerceContext()
    if (req.body.physicalItems.length && !context.enabled) return forbidden('Physical checkout is currently unavailable.')
    const simulation = simulationEnabled(context)
    if ((context.localPreview || process.env.LOCAL_COMMERCE_PREVIEW === 'true') && !simulation) {
      return forbidden('Local preview payment configuration is unavailable.')
    }

    const supabase = createServiceClient()
    let configuration: ReturnType<typeof payfastCredentials> & { baseUrl: string; notifyOrigin: string } | undefined
    let customer: { name: string; email: string } | undefined
    if (!simulation) {
      // Resolve every external payment setting before the database creates a
      // pending order or reserves stock.
      configuration = { baseUrl: siteUrl(), notifyOrigin: apiOrigin(), ...payfastCredentials() }
      const { data, error } = await supabase.from('users').select('name,email').eq('id', user.id).single<{ name: string; email: string }>()
      if (error || !data) throw error ?? new Error('Customer account not found.')
      customer = data
    }
    const { data, error } = await supabase.rpc('create_commerce_order', {
      ...quoteArgs(user.id, req.body), p_reference: orderReference(), p_expected_total_zar: req.body.expectedTotalZar,
    })
    const businessError = rpcBusinessError(error)
    if (businessError) return businessError
    if (error) throw error
    const checkout = data as CommerceCheckoutResponse
    if (!checkout?.orderId || !checkout.paymentId || !checkout.reference || toCents(checkout.totalZar) <= 0) throw new Error('Invalid checkout response.')
    if (simulation) return created({ ...checkout, simulation: true })
    if (!configuration || !customer) throw new Error('Payment configuration is unavailable.')
    const payfast = buildPayfastProcess({
      merchant_id: configuration.merchantId,
      merchant_key: configuration.merchantKey,
      return_url: `${configuration.baseUrl}/checkout/return?order=${checkout.orderId}`,
      cancel_url: `${configuration.baseUrl}/checkout/cancel?order=${checkout.orderId}`,
      notify_url: `${configuration.notifyOrigin}/api/payment-webhook`,
      name_first: customer.name.split(/\s+/)[0] ?? customer.name,
      email_address: customer.email,
      m_payment_id: checkout.paymentId,
      amount: formatPayfastAmount(toCents(checkout.totalZar)),
      item_name: `Designing Minds ${checkout.reference}`,
      item_description: checkout.hasPhysical ? 'Digital resources and physical products' : `${checkout.items.length} digital resources`,
    })
    return created({ ...checkout, payfast })
  } catch (error) {
    logEvent('checkout.failed', { errorKind: error instanceof Error ? error.name : 'Error', code: error && typeof error === 'object' && 'code' in error ? error.code : undefined })
    return serverError('Unable to start checkout.')
  }
}

export const commerceCancel: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isRecord(req.body) || !boundedString(req.body.orderId, 36, true) || !UUID_RE.test(req.body.orderId)) return badRequest('Expected an order id.')
  let user
  try { user = await requireUser(req.headers) }
  catch (error) { return unauthorized(error instanceof Error ? error.message : 'Authentication required.') }
  try {
    const { data, error } = await createServiceClient().rpc('cancel_commerce_order', { p_customer_id: user.id, p_order_id: req.body.orderId })
    const businessError = rpcBusinessError(error)
    if (businessError) return businessError
    if (error) throw error
    if (data !== true) return { status: 409, body: { error: 'This order cannot be cancelled.' } }
    return ok({ orderId: req.body.orderId, status: 'cancelled' })
  } catch (error) {
    logEvent('checkout.failed', { errorKind: error instanceof Error ? error.name : 'Error' })
    return serverError('Unable to cancel this order.')
  }
}

function isLoopbackSupabaseUrl(value: string | undefined): boolean {
  try {
    const url = new URL(value ?? '')
    const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(host)
  } catch { return false }
}

export function simulationEnabled(context: CommerceContext, env: NodeJS.ProcessEnv = process.env): boolean {
  return env.LOCAL_COMMERCE_PREVIEW === 'true' && env.NODE_ENV !== 'production' && isLoopbackSupabaseUrl(env.SUPABASE_URL) && context.enabled && context.localPreview
}

interface SimulationPayment { id: string; orderId: string; amountZar: number | string; status: string; provider: string }
interface SimulationOrder { id: string; customerId: string; status: string; paymentId: string; payments?: SimulationPayment[] }

export const commercePaymentSimulate: Handler = async (req) => {
  if (req.method !== 'POST') return notFound('Not found.')
  let context: CommerceContext
  try { context = await getCommerceContext() } catch { return notFound('Not found.') }
  if (!simulationEnabled(context)) return notFound('Not found.')
  if (!isRecord(req.body) || !boundedString(req.body.orderId, 36, true) || !UUID_RE.test(req.body.orderId) || !['succeeded', 'failed', 'cancelled'].includes(String(req.body.outcome))) return badRequest('Expected an order id and a supported outcome.')
  let user
  try { user = await requireUser(req.headers) }
  catch { return unauthorized('Authentication required.') }

  try {
    const supabase = createServiceClient()
    const { data: order, error } = await supabase.from('orders').select('id,customerId,status,paymentId,payments(id,orderId,amountZar,status,provider)').eq('id', req.body.orderId).eq('customerId', user.id).maybeSingle<SimulationOrder>()
    if (error) throw error
    if (!order) return notFound('Order not found.')
    const payment = order.payments?.find((entry) => entry.id === order.paymentId && entry.orderId === order.id)
    if (!payment || payment.provider !== 'Simulation') return notFound('Local simulation payment not found.')
    const outcome = req.body.outcome as 'succeeded' | 'failed' | 'cancelled'
    if (outcome === 'succeeded') {
      if (['failed', 'cancelled', 'refunded'].includes(payment.status)) return { status: 409, body: { error: 'This payment can no longer be completed.' } }
      const { data: result, error: completionError } = await supabase.rpc('complete_commerce_payment', {
        p_payment_id: payment.id, p_provider_payment_id: `LOCAL-SIM-${payment.id}`, p_amount_zar: payment.amountZar,
      })
      const businessError = rpcBusinessError(completionError)
      if (businessError) return businessError
      if (completionError) throw completionError
      if (result === 'rejected') return { status: 409, body: { error: 'This payment can no longer be completed.' } }
      if (!['processed', 'duplicate', 'recovered', 'review'].includes(String(result))) throw new Error('Unexpected local payment result.')
      return ok({ outcome, status: result === 'review' || order.status === 'payment_review' ? 'payment_review' : 'paid', orderId: order.id })
    }
    const { data: cancelled, error: cancelError } = await supabase.rpc('cancel_commerce_order', { p_customer_id: user.id, p_order_id: order.id })
    const businessError = rpcBusinessError(cancelError)
    if (businessError) return businessError
    if (cancelError) throw cancelError
    if (cancelled !== true) return { status: 409, body: { error: 'This order cannot be cancelled.' } }
    return ok({ outcome, status: 'cancelled', orderId: order.id })
  } catch (error) {
    logEvent('checkout.failed', { errorKind: error instanceof Error ? error.name : 'Error' })
    return serverError('Unable to simulate this payment.')
  }
}

interface FulfillmentInput { orderId: string; status: string; trackingNumber?: string | null; trackingUrl?: string | null }
const validFulfillment = (value: unknown): value is FulfillmentInput => isRecord(value) && typeof value.orderId === 'string' && UUID_RE.test(value.orderId) &&
  ['shipped', 'delivered'].includes(String(value.status)) &&
  (value.trackingNumber === undefined || value.trackingNumber === null || boundedString(value.trackingNumber, 100)) &&
  (value.trackingUrl === undefined || value.trackingUrl === null || boundedString(value.trackingUrl, 2000))

export const adminOrderFulfillment: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!validFulfillment(req.body)) return badRequest('Expected an order id, fulfillment status, and optional tracking details.')
  let admin
  try { admin = await requireAdmin(req.headers) }
  catch (error) { return adminAuthFailure(error) }
  try {
    const token = (req.headers.authorization ?? req.headers.Authorization ?? '').replace(/^Bearer\s+/i, '')
    // The database function checks auth.uid() and is_admin() itself; keep the
    // administrator JWT on the RPC call so the database sees the same actor.
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    void admin
    const { data, error } = await supabase.rpc('set_order_fulfillment', {
      p_order_id: req.body.orderId,
      p_status: req.body.status,
      p_tracking_number: req.body.trackingNumber ?? null,
      p_tracking_url: req.body.trackingUrl ?? null,
    })
    if (error?.code === '42501') return forbidden('Administrator access is required.')
    const businessError = rpcBusinessError(error)
    if (businessError) return businessError
    if (error) throw error
    return ok(data)
  } catch (error) {
    logEvent('checkout.failed', { errorKind: error instanceof Error ? error.name : 'Error' })
    return serverError('Unable to update order fulfillment.')
  }
}
