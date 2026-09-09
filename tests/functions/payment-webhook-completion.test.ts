import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn(), update: vi.fn(), validate: vi.fn(), log: vi.fn() }))
vi.mock('../../apps/functions/src/lib/diagnostics.ts', () => ({ logEvent: mocks.log }))
vi.mock('../../apps/functions/src/lib/payfast.ts', () => ({
  explainPayfastSignature: () => ({ accepted: true, matchedVariant: 'received-order' }),
  verifyPayfastSourceIp: async () => true,
  validatePayfastData: mocks.validate,
}))
vi.mock('../../apps/functions/src/lib/supabase.ts', () => ({ createServiceClient: () => ({
  from: () => ({ select: () => ({ eq: () => ({ single: mocks.single }) }), update: mocks.update }), rpc: mocks.rpc,
}) }))
import { paymentWebhook } from '../../apps/functions/src/handlers/payment-webhook.ts'
const orderId = '12345678-1234-4234-8234-123456789012'
const paymentId = '22345678-1234-4234-8234-123456789012'
const req = { method: 'POST', headers: {}, body: { m_payment_id: paymentId, pf_payment_id: 'PF-123', amount_gross: '100.00', payment_status: 'COMPLETE' } }
beforeEach(() => {
  vi.clearAllMocks()
  mocks.validate.mockResolvedValue(true)
  mocks.single.mockResolvedValue({ data: { id: paymentId, orderId, status: 'pending', amountZar: '100.00', processedAt: null }, error: null })
  mocks.rpc.mockResolvedValue({ data: 'processed', error: null })
})
it('uses one transaction for successful completion, never separate updates', async () => {
  expect(await paymentWebhook(req)).toMatchObject({ status: 200, body: { processed: true } })
  expect(mocks.rpc).toHaveBeenCalledWith('complete_payfast_payment', { p_payment_id: paymentId, p_pf_payment_id: 'PF-123', p_amount_zar: '100.00' })
  expect(mocks.update).not.toHaveBeenCalled()
})
it('validates and reconciles an already-succeeded payment rather than skipping its pending order', async () => {
  mocks.single.mockResolvedValue({ data: { id: paymentId, orderId, status: 'succeeded', amountZar: '100.00', processedAt: '2026-09-09' } })
  mocks.rpc.mockResolvedValue({ data: 'recovered', error: null })
  expect(await paymentWebhook(req)).toMatchObject({ status: 200, body: { processed: true } })
  expect(mocks.validate).toHaveBeenCalled()
  expect(mocks.log).toHaveBeenCalledWith('payment.recovered', { orderId })
})
it('allows a transient database failure to retry without exposing database detail', async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'private db detail' } })
  const response = await paymentWebhook(req)
  expect(response.status).toBe(503)
  expect(JSON.stringify(response.body)).not.toContain('private db detail')
})
it.each(['rejected', 'duplicate'])('handles a %s transaction without further writes', async (result) => {
  mocks.rpc.mockResolvedValue({ data: result, error: null })
  const response = await paymentWebhook(req)
  expect(response.status).toBe(200)
  expect(response.body).toMatchObject(result === 'duplicate' ? { duplicate: true } : { processed: false })
})
it('never invokes completion after provider validation fails', async () => {
  mocks.validate.mockResolvedValue(false)
  expect(await paymentWebhook(req)).toMatchObject({ status: 200, body: { processed: false } })
  expect(mocks.rpc).not.toHaveBeenCalled()
})
