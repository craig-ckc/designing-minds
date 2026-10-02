import { checkoutQuote } from '../src/handlers/checkout.ts'
import { handleVercel } from './_adapter.ts'
export const config = { api: { bodyParser: false } }
export default handleVercel.bind(null, checkoutQuote)
