import { issueDownload } from '../src/handlers/issue-download.ts'
import { handleVercel } from './_adapter.ts'

export const config = { api: { bodyParser: false } }

export default handleVercel.bind(null, issueDownload)

