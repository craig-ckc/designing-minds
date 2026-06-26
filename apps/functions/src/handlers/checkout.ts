import type { Product } from '@designing-minds/cms/types'
import { badRequest, created, serverError, unauthorized, type Handler } from '../lib/http.ts'
import { createServiceClient } from '../lib/supabase.ts'
import { requireUser } from '../lib/auth.ts'
import { formatPayfastAmount, toCents } from '../lib/money.ts'
import { buildPayfastProcess } from '../lib/payfast.ts'

interface CheckoutInput {
  items: { productSlug: string }[]
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

const siteUrl = () => {
  const configured = process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (!configured) throw new Error('SITE_URL must be set for checkout URLs.')
  return configured.startsWith('http') ? configured : `https://${configured}`
}

const orderReference = () => `DM-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

export const checkout: Handler = async (req) => {
  if (req.method !== 'POST') return badRequest('Use POST.')
  if (!isCheckoutInput(req.body)) return badRequest('Expected { items: [{ productSlug }] }.')
  if (req.body.items.length === 0) return badRequest('Cart is empty.')

  let user
  try {
    user = await requireUser(req.headers)
  } catch (error) {
    return unauthorized(error instanceof Error ? error.message : 'Authentication required.')
  }

  try {
    const supabase = createServiceClient()
    const slugs = [...new Set(req.body.items.map((item) => item.productSlug))]
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id,name,email')
      .eq('id', user.id)
      .single<CustomerRow>()
    if (customerError) throw new Error(customerError.message)

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('slug', slugs)
      .eq('published', true)
    if (productsError) throw new Error(productsError.message)
    if (!products || products.length !== slugs.length) return badRequest('One or more cart items are unavailable.')

    const { data: paidOrders, error: paidOrdersError } = await supabase
      .from('orders')
      .select('items')
      .eq('customerId', user.id)
      .in('status', ['paid', 'fulfilled'])
    if (paidOrdersError) throw new Error(paidOrdersError.message)

    const ownedSlugs = new Set(
      (paidOrders ?? []).flatMap((order) =>
        Array.isArray(order.items) ? order.items.map((item) => (typeof item === 'object' && item ? (item as { productSlug?: string }).productSlug : null)) : [],
      ),
    )
    const repurchased = slugs.find((slug) => ownedSlugs.has(slug))
    if (repurchased) return badRequest('Your account already owns one or more cart items.')

    const resolvedProducts = products as Product[]
    const items = resolvedProducts.map((product) => ({
      id: crypto.randomUUID(),
      productSlug: product.slug,
      title: product.title,
      productKind: product.productKind,
      priceZar: Number(product.priceZar),
    }))
    const totalCents = items.reduce((sum, item) => sum + toCents(item.priceZar), 0)
    if (totalCents <= 0) return badRequest('Order total must be greater than zero.')

    const orderId = crypto.randomUUID()
    const paymentId = crypto.randomUUID()
    const reference = orderReference()
    const totalZar = formatPayfastAmount(totalCents)

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
    if (orderCreateError) throw new Error(orderCreateError.message)

    if (process.env.FAKE_PAYFAST_ENABLED === 'true') {
      return created({
        orderId,
        paymentId,
        reference,
        fakePayfast: {
          path: `/checkout/fake-payfast?order=${orderId}`,
        },
      })
    }

    const baseUrl = siteUrl()
    if (!process.env.PAYFAST_MERCHANT_ID || !process.env.PAYFAST_MERCHANT_KEY) {
      throw new Error('PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY must be set.')
    }
    const payfast = buildPayfastProcess({
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: `${baseUrl}/checkout/return?order=${orderId}`,
      cancel_url: `${baseUrl}/checkout/cancel?order=${orderId}`,
      notify_url: `${baseUrl}/api/payment-webhook`,
      name_first: customer.name.split(/\s+/)[0] ?? customer.name,
      email_address: customer.email,
      m_payment_id: paymentId,
      amount: totalZar,
      item_name: `Designing Minds ${reference}`,
      item_description: `${items.length} digital resource${items.length === 1 ? '' : 's'}`,
    })

    return created({ orderId, paymentId, reference, payfast })
  } catch (error) {
    console.error('checkout failed:', error instanceof Error ? error.message : error)
    return serverError('Unable to start checkout.')
  }
}
