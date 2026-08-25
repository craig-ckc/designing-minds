import { ok, type Handler, type HandlerResponse } from '../lib/http.ts'
import { amountMatches } from '../lib/money.ts'
import {
  explainPayfastSignature,
  validatePayfastData,
  verifyPayfastSourceIp,
  type PayfastFields,
  type PayfastSignatureCheck,
} from '../lib/payfast.ts'
import { createServiceClient } from '../lib/supabase.ts'

const asFields = (value: unknown): PayfastFields => (typeof value === 'object' && value !== null ? (value as PayfastFields) : {})

class PermanentItnRejection extends Error {}

const retryLater = (message: string): HandlerResponse => ({ status: 503, body: { received: false, error: message } })

// Logs enough to attribute a signature mismatch (transport, field order, which
// canonicalisation PayFast used, passphrase source) without the shopper's
// name or email. PayFast does not retry an ITN we answer 200 to, so this is
// the only record of what it sent.
const logSignatureMismatch = (req: Parameters<Handler>[0], fields: PayfastFields, check: PayfastSignatureCheck) => {
  console.error(
    'PayFast ITN signature mismatch:',
    JSON.stringify({
      contentType: req.headers['content-type'] ?? req.headers['Content-Type'] ?? null,
      rawBodyLength: req.rawBody?.length ?? 0,
      parsedKeys: check.keys,
      m_payment_id: fields.m_payment_id ?? null,
      pf_payment_id: fields.pf_payment_id ?? null,
      payment_status: fields.payment_status ?? null,
      amount_gross: fields.amount_gross ?? null,
      merchant_id: fields.merchant_id ?? null,
      receivedSignature: check.received || null,
      expectedSignature: check.expected,
      matchedVariant: check.matchedVariant,
      passphraseSource: check.passphraseSource,
      passphraseLength: check.passphraseLength,
    }),
  )
}

interface PaymentRow {
  id: string
  orderId: string
  amountZar: number | string
  status: string
  processedAt: string | null
}

const markPaymentFailed = async (payment: PaymentRow) => {
  if (payment.processedAt || payment.status !== 'pending') return

  const supabase = createServiceClient()
  const { data: updatedPayment, error: updatePaymentError } = await supabase
    .from('payments')
    .update({ status: 'failed' })
    .eq('id', payment.id)
    .eq('status', 'pending')
    .is('processedAt', null)
    .select('id')
    .maybeSingle()
  if (updatePaymentError) throw new Error(updatePaymentError.message)
  if (!updatedPayment) return

  const { error: updateOrderError } = await supabase.from('orders').update({ status: 'failed' }).eq('id', payment.orderId).eq('status', 'pending')
  if (updateOrderError) throw new Error(updateOrderError.message)
}

export const paymentWebhook: Handler = async (req) => {
  if (req.method !== 'POST') return ok({ received: true })

  const fields = asFields(req.body)
  try {
    const signature = explainPayfastSignature(fields)
    if (!signature.accepted) {
      logSignatureMismatch(req, fields, signature)
      throw new PermanentItnRejection('Invalid PayFast signature.')
    }
    if (signature.matchedVariant !== 'received-order') {
      console.warn(`PayFast ITN signature matched the "${signature.matchedVariant}" canonicalisation rather than the documented one.`)
    }
    if (!(await verifyPayfastSourceIp(req.headers))) throw new PermanentItnRejection('Invalid PayFast source IP.')

    const paymentId = String(fields.m_payment_id ?? '')
    const pfPaymentId = String(fields.pf_payment_id ?? '')
    const amountGross = String(fields.amount_gross ?? '')
    if (!paymentId || !pfPaymentId || !amountGross) throw new Error('Missing PayFast ITN fields.')

    const supabase = createServiceClient()
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id,orderId,amountZar,status,processedAt')
      .eq('id', paymentId)
      .single<PaymentRow>()
    if (paymentError) throw new Error(paymentError.message)
    if (payment?.processedAt) return ok({ received: true, duplicate: true })
    if (!amountMatches(amountGross, payment.amountZar)) throw new PermanentItnRejection('PayFast amount mismatch.')
    if (!(await validatePayfastData(fields))) throw new PermanentItnRejection('PayFast validate endpoint rejected the ITN.')

    const paymentStatus = String(fields.payment_status ?? '')
    if (paymentStatus !== 'COMPLETE') {
      if (['FAILED', 'CANCELLED'].includes(paymentStatus)) await markPaymentFailed(payment)
      throw new PermanentItnRejection(`PayFast payment is ${paymentStatus || 'not complete'}.`)
    }

    const { data: existing } = await supabase.from('payments').select('id,processedAt').eq('pfPaymentId', pfPaymentId).maybeSingle()
    if (existing?.processedAt) return ok({ received: true, duplicate: true })

    const processedAt = new Date().toISOString()
    const { data: updatedPayment, error: updatePaymentError } = await supabase
      .from('payments')
      .update({ status: 'succeeded', pfPaymentId, processedAt })
      .eq('id', paymentId)
      .eq('status', 'pending')
      .is('processedAt', null)
      .select('id')
      .maybeSingle()
    if (updatePaymentError) throw new Error(updatePaymentError.message)
    if (!updatedPayment) return ok({ received: true, duplicate: true })

    const { error: updateOrderError } = await supabase.from('orders').update({ status: 'paid' }).eq('id', payment.orderId).eq('status', 'pending')
    if (updateOrderError) throw new Error(updateOrderError.message)

    return ok({ received: true, processed: true })
  } catch (error) {
    console.error('PayFast ITN ignored:', error instanceof Error ? error.message : error)
    if (error instanceof PermanentItnRejection) return ok({ received: true, processed: false })
    return retryLater(error instanceof Error ? error.message : 'Temporary PayFast ITN processing error.')
  }
}
