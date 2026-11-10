import { paymentWebhook } from '../src/handlers/payment-webhook.ts'
import { handleVercel } from './_adapter.ts'

export const config = { api: { bodyParser: false } }

export default handleVercel.bind(null, paymentWebhook)

