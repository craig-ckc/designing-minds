import { promotionsCron } from '../../src/handlers/promotions-cron.ts'
import { handleVercel } from '../_adapter.ts'
export default handleVercel.bind(null, promotionsCron)
