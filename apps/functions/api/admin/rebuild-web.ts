import { adminRebuildWeb } from '../../src/handlers/admin-rebuild-web.ts'
import { handleVercel } from '../_adapter.ts'

export const config = { api: { bodyParser: false } }

export default handleVercel.bind(null, adminRebuildWeb)
