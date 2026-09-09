import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest'

const db = new PGlite()
const orderId = '12345678-1234-4234-8234-123456789012'
const paymentId = '22345678-1234-4234-8234-123456789012'
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create table orders (id uuid primary key, status text, "paymentId" uuid, "totalZar" numeric);
    create table payments (id uuid primary key, "orderId" uuid references orders(id), status text, provider text,
      "pfPaymentId" text unique, "amountZar" numeric, "processedAt" timestamptz);`)
  await db.exec(readFileSync(new URL('../../supabase/patch/2026-09-09-atomic-payment-completion.sql', import.meta.url), 'utf8'))
}, 20_000)
beforeEach(async () => {
  await db.exec(`reset role; drop trigger if exists fail_order_update on orders; truncate payments, orders;
    insert into orders values ('${orderId}', 'pending', '${paymentId}', 100);
    insert into payments values ('${paymentId}', '${orderId}', 'pending', 'PayFast', null, 100, null);`)
})
afterAll(() => db.close())
const complete = async (providerId = 'PF-123', amount = 100) =>
  (await db.query<{ result: string }>('select public.complete_payfast_payment($1::uuid, $2, $3::numeric) as result', [paymentId, providerId, amount])).rows[0].result
const states = async () => (await db.query<{ orderStatus: string; paymentStatus: string; processedAt: string | null }>(`select o.status as "orderStatus", p.status as "paymentStatus", p."processedAt" from orders o join payments p on p."orderId" = o.id`)).rows[0]

it('completes both records and handles a repeated notification idempotently', async () => {
  expect(await complete()).toBe('processed')
  expect(await states()).toMatchObject({ orderStatus: 'paid', paymentStatus: 'succeeded' })
  const before = await states()
  expect(await complete()).toBe('duplicate')
  expect(await states()).toEqual(before)
})
it('rolls back payment success when the order update fails, allowing a safe retry', async () => {
  await db.exec(`create or replace function fail_update() returns trigger language plpgsql as $$begin raise exception 'test order failure'; end;$$;
    create trigger fail_order_update before update on orders for each row execute function fail_update();`)
  await expect(complete()).rejects.toThrow('test order failure')
  expect(await states()).toMatchObject({ orderStatus: 'pending', paymentStatus: 'pending', processedAt: null })
  await db.exec('drop trigger fail_order_update on orders')
  expect(await complete()).toBe('processed')
})
it('repairs the previous split-update state only for the same verified provider transaction', async () => {
  await db.exec(`update payments set status = 'succeeded', "pfPaymentId" = 'PF-123', "processedAt" = now()`)
  expect(await complete('PF-WRONG')).toBe('rejected')
  expect((await states()).orderStatus).toBe('pending')
  expect(await complete()).toBe('recovered')
  expect((await states()).orderStatus).toBe('paid')
})
it('rejects amount mismatches and never resurrects refunded or failed records', async () => {
  expect(await complete('PF-123', 99)).toBe('rejected')
  for (const status of ['failed', 'refunded']) {
    await db.query('update orders set status = $1', [status])
    expect(await complete()).toBe('rejected')
    expect((await states()).paymentStatus).toBe('pending')
  }
  await db.exec("update orders set status = 'pending'")
  for (const status of ['failed', 'refunded']) {
    await db.query('update payments set status = $1', [status])
    expect(await complete()).toBe('rejected')
    expect((await states()).orderStatus).toBe('pending')
  }
})
it('preserves a fulfilled order when a duplicate completion is delivered', async () => {
  await complete()
  await db.exec("update orders set status = 'fulfilled'")
  expect(await complete()).toBe('duplicate')
  expect((await states()).orderStatus).toBe('fulfilled')
})
it('rejects an order/payment link mismatch and provider transaction reuse', async () => {
  await db.exec(`update orders set "paymentId" = gen_random_uuid()`)
  expect(await complete()).toBe('rejected')
  await db.exec(`update orders set "paymentId" = '${paymentId}';
    insert into payments values (gen_random_uuid(), '${orderId}', 'succeeded', 'PayFast', 'PF-123', 100, now());`)
  expect(await complete()).toBe('rejected')
})
it('only permits the service role to invoke completion', async () => {
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`)
    await expect(complete()).rejects.toThrow(/permission denied/)
    await db.exec('reset role')
  }
  await db.exec('set role service_role')
  expect(await complete()).toBe('processed')
})
