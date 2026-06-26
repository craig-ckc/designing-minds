import { fakePayfastComplete } from '../../src/index.ts'
import { handleVercel } from '../_adapter.ts'

export const config = { api: { bodyParser: false } }

export default handleVercel.bind(null, fakePayfastComplete)
