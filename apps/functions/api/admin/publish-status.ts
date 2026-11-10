import { adminPublishStatus } from '../../src/handlers/admin-publish-status.ts'
import { handleVercel } from '../_adapter.ts'

export const config = { api: { bodyParser: false } }

export default handleVercel.bind(null, adminPublishStatus)
