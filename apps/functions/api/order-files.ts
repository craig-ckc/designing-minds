import { orderFiles } from '../src/handlers/order-files.ts'
import { handleVercel } from './_adapter.ts'

export const config = { api: { bodyParser: false } }

export default handleVercel.bind(null, orderFiles)
