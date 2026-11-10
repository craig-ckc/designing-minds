import { unsubscribe } from '../src/handlers/unsubscribe.ts'
import { handleVercel } from './_adapter.ts'

export const config = { api: { bodyParser: false } }

export default handleVercel.bind(null, unsubscribe)
