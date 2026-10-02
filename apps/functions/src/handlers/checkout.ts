import { logEvent } from '../lib/diagnostics.ts'
import type { Bundle, Product } from '@designing-minds/cms/types'
import { badRequest, created, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { createServiceClient } from '../lib/supabase.ts'
import { requireUser } from '../lib/auth.ts'
import { formatPayfastAmount, toCents } from '../lib/money.ts'
import { buildPayfastProcess, payfastCredentials } from '../lib/payfast.ts'
import { apiOrigin, siteUrl } from '../lib/origins.ts'

interface CheckoutInput {
  items: { productSlug: string }[]
  acceptedTerms?: unknown
}

interface CustomerRow {
  id: string
  name: string
  email: string
}

function isCheckoutInput(value: unknown): value is CheckoutInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as CheckoutInput).items) &&
    (value as CheckoutInput).items.every((item) => typeof item?.productSlug === 'string')
  )
}

const orderReference = () => `DM-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

export const checkout: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isCheckoutInput(req.body)) return badRequest('Expected { items: [{ productSlug }] }.')
  if (req.body.items.length === 0) return badRequest('Cart is empty.')
  if (req.body.acceptedTerms !== true) return badRequest('You must agree to the Terms of Use before checkout.')

  let user
  try {
    logEvent('checkout.auth')
    user = await requireUser(req.headers)
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : 'Authentication required.')
  }

  try {
    logEvent('checkout.configuration')
    const baseUrl = siteUrl()
    const notifyOrigin = apiOrigin()
    const { merchantId, merchantKey } = payfastCredentials()
    logEvent('checkout.catalogue')
    const supabase = createServiceClient()
    const slugs = [...new Set(req.body.items.map((item) => item.productSlug))]
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('id,name,email')
      .eq('id', user.id)
      .single<CustomerRow>()
    if (customerError) throw customerError

    // A cart line is a slug in the shared /shop space and may name either
    // Collection, so both are resolved and the union must cover every line.
    // Read from the LIVE catalogue views, never the tables: the tables hold the
    // editors' working copies, and a Draft or Queued price must not be charged
    // before it is published — the customer was shown the live one.
    const [productRows, bundleRows] = await Promise.all([
      supabase.from('catalog_products').select('*').in('slug', slugs),
      supabase.from('catalog_bundles').select('*').in('slug', slugs),
    ])
    if (productRows.error) throw productRows.error
    if (bundleRows.error) throw bundleRows.error

    const products = (productRows.data ?? []) as Product[]
    const bundles = (bundleRows.data ?? []) as Bundle[]
    if (products.length + bundles.length !== slugs.length) {
      return badRequest('One or more cart items are unavailable.')
    }

    logEvent('checkout.ownership')
    const { data: paidOrders, error: paidOrdersError } = await supabase
      .from('orders')
      .select('items')
      .eq('customerId', user.id)
      .in('status', ['paid', 'fulfilled'])
    if (paidOrdersError) throw paidOrdersError

    const ownedSlugs = new Set(
      (paidOrders ?? []).flatMap((order) =>
        Array.isArray(order.items) ? order.items.map((item) => (typeof item === 'object' && item ? (item as { productSlug?: string }).productSlug : null)) : [],
      ),
    )
    const repurchased = slugs.find((slug) => ownedSlugs.has(slug))
    if (repurchased) return badRequest('Your account already owns one or more cart items.')

    // Products and bundles both carry their own fixed grade, so the order line
    // records it directly; see docs/decisions.md. `productKind` is a snapshot
    // of what was bought, not a live reference.
    const items = [
      ...products.map((product) => ({
        id: crypto.randomUUID(),
        productSlug: product.slug,
        title: product.title,
        productKind: 'Single' as const,
        priceZar: Number(product.priceZar),
        grade: product.grade,
      })),
      ...bundles.map((bundle) => ({
        id: crypto.randomUUID(),
        productSlug: bundle.slug,
        title: bundle.title,
        productKind: 'Bundle' as const,
        priceZar: Number(bundle.priceZar),
        grade: bundle.grade,
      })),
    ]
    const totalCents = items.reduce((sum, item) => sum + toCents(item.priceZar), 0)
    if (totalCents <= 0) return badRequest('Order total must be greater than zero.')

    const orderId = crypto.randomUUID()
    const paymentId = crypto.randomUUID()
    const reference = orderReference()
    const totalZar = formatPayfastAmount(totalCents)

    logEvent('checkout.order')
    const { error: orderCreateError } = await supabase.rpc('create_pending_order', {
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_reference: reference,
      p_customer_id: customer.id,
      p_customer_name: customer.name,
      p_customer_email: customer.email,
      p_items: items,
      p_total_zar: totalZar,
    })
    if (orderCreateError) throw orderCreateError

    logEvent('checkout.order.created', { orderId })
    const payfast = buildPayfastProcess({
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${baseUrl}/checkout/return?order=${orderId}`,
      cancel_url: `${baseUrl}/checkout/cancel?order=${orderId}`,
      // The ITN must hit the functions origin directly — see lib/origins.ts.
      notify_url: `${notifyOrigin}/api/payment-webhook`,
      name_first: customer.name.split(/\s+/)[0] ?? customer.name,
      email_address: customer.email,
      m_payment_id: paymentId,
      amount: totalZar,
      item_name: `Designing Minds ${reference}`,
      item_description: `${items.length} digital resource${items.length === 1 ? '' : 's'}`,
    })

    return created({ orderId, paymentId, reference, payfast })
  } catch (error) {
    logEvent('checkout.failed', { errorKind: error instanceof Error ? error.name : 'Error', code: error && typeof error === 'object' && 'code' in error ? error.code : undefined })
    return serverError('Unable to start checkout.')
  }
}
