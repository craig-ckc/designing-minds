import { commerceCancel } from '../../src/handlers/commerce.ts'
import { handleVercel } from '../_adapter.ts'

export const config = { api: { bodyParser: false } }
export default handleVercel.bind(null, commerceCancel)
