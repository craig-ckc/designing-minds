import assert from 'node:assert/strict'
import test from 'node:test'
import { loadCustomerAccount } from '../../apps/web/src/lib/customer-account.ts'

type Client = Parameters<typeof loadCustomerAccount>[0]
interface Call { table: string; columns: string; filter: string; value: unknown }

const fakeClient = ({ orders = [], payments = [], orderError = null, paymentError = null }: {
  orders?: Record<string, unknown>[]
  payments?: Record<string, unknown>[]
  orderError?: { message: string } | null
  paymentError?: { message: string } | null
} = {}) => {
  const calls: Call[] = []
  const client = {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: async (filter: string, value: string) => {
          calls.push({ table, columns, filter, value })
          return { data: orders.filter((order) => order[filter] === value), error: orderError }
        },
        in: async (filter: string, value: string[]) => {
          calls.push({ table, columns, filter, value })
          return { data: payments.filter((payment) => value.includes(payment[filter] as string)), error: paymentError }
        },
      }),
    }),
  } as unknown as Client
  return { client, calls }
}

test('account loading selects only this customer’s orders and the corresponding payments', async () => {
  const { client, calls } = fakeClient({
    orders: [
      { id: 'order-1', customerId: 'customer-1', totalZar: '150.50', subtotalZar: '200.50', discountZar: '50' },
      { id: 'order-2', customerId: 'customer-2', totalZar: '900' },
    ],
    payments: [
      { id: 'payment-1', orderId: 'order-1', amountZar: '150.50' },
      { id: 'payment-2', orderId: 'order-2', amountZar: '900' },
    ],
  })

  const data = await loadCustomerAccount(client, 'customer-1')

  assert.deepEqual(data.orders.map((order) => order.id), ['order-1'])
  assert.deepEqual(data.payments.map((payment) => payment.id), ['payment-1'])
  assert.equal(data.orders[0].totalZar, 150.5)
  assert.equal(data.orders[0].subtotalZar, 200.5)
  assert.equal(data.orders[0].discountZar, 50)
  assert.equal(data.payments[0].amountZar, 150.5)
  assert.deepEqual(calls.map(({ table, filter, value }) => ({ table, filter, value })), [
    { table: 'orders', filter: 'customerId', value: 'customer-1' },
    { table: 'payments', filter: 'orderId', value: ['order-1'] },
  ])
  assert.ok(calls.every((call) => !call.columns.includes('*')), 'no catalogue or unbounded column selection')
})

test('a new customer gets an empty account without a payment query', async () => {
  const { client, calls } = fakeClient()
  assert.deepEqual(await loadCustomerAccount(client, 'new-customer'), { orders: [], payments: [] })
  assert.deepEqual(calls.map((call) => call.table), ['orders'])
})

test('legacy orders preserve absent subtotals and default absent discounts', async () => {
  const { client } = fakeClient({ orders: [{ id: 'old-order', customerId: 'customer-1', totalZar: '25', subtotalZar: null }] })
  const { orders } = await loadCustomerAccount(client, 'customer-1')
  assert.equal(orders[0].subtotalZar, null)
  assert.equal(orders[0].discountZar, 0)
})

test('a missing identity never makes a database request', async () => {
  const { client, calls } = fakeClient()
  await assert.rejects(loadCustomerAccount(client, ''), /Authentication required/)
  assert.deepEqual(calls, [])
})

test('order failures stop account loading without issuing a payment query', async () => {
  const { client, calls } = fakeClient({ orderError: { message: 'orders unavailable' } })
  await assert.rejects(loadCustomerAccount(client, 'customer-1'), /orders unavailable/)
  assert.deepEqual(calls.map((call) => call.table), ['orders'])
})

test('payment failures are reported instead of rendering an incomplete account', async () => {
  const { client } = fakeClient({
    orders: [{ id: 'order-1', customerId: 'customer-1', totalZar: 25 }],
    paymentError: { message: 'payments unavailable' },
  })
  await assert.rejects(loadCustomerAccount(client, 'customer-1'), /payments unavailable/)
})
