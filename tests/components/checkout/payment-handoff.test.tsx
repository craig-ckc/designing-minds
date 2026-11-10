import { expect, it, vi } from 'vitest'
import { postToPayment } from '../../../apps/web/src/lib/payment-handoff'

it('posts all payment fields unchanged to the provided payment endpoint', () => {
  const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (this: HTMLFormElement) {
    expect(this.method).toBe('post')
    expect(this.action).toBe('https://sandbox.payfast.co.za/eng/process')
    expect(this.isConnected).toBe(true)
    expect(Object.fromEntries(new FormData(this))).toEqual({ amount: '50.00', custom_str1: '<literal>&value', enabled: 'true', count: '2' })
  })
  postToPayment({ url: 'https://sandbox.payfast.co.za/eng/process', fields: { amount: '50.00', custom_str1: '<literal>&value', enabled: true, count: 2 } })
  expect(submit).toHaveBeenCalledOnce()
  document.querySelector('form[action="https://sandbox.payfast.co.za/eng/process"]')?.remove()
})
