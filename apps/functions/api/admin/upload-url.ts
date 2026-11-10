import { adminUploadUrl } from '../../src/handlers/admin-upload-url.ts'
import { handleVercel } from '../_adapter.ts'

export const config = { api: { bodyParser: false } }

export default handleVercel.bind(null, adminUploadUrl)

