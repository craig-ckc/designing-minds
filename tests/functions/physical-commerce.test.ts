import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { CommerceCheckoutResponse, CommerceQuote, DeliveryDetails, PhysicalCartLine, PhysicalProduct } from '../../packages/cms/src/index.ts'

const read = (name: string) => readFileSync(new URL(`../../supabase/${name}`, import.meta.url), 'utf8')
const schema = read('schema.sql')
const previousSchema = schema.split('-- BEGIN physical commerce journey')[0]
const patch = read('patch/2026-11-10-physical-commerce.sql')
// Later patches reshape the same functions; the journey is proven against the final state.
const laterPatches = [read('patch/2026-11-12-order-line-identity.sql'), read('patch/2026-11-12-physical-options.sql')]
const db = new PGlite()
const A = '10000000-0000-4000-8000-000000000001'
const B = '10000000-0000-4000-8000-000000000002'
const ADMIN = '10000000-0000-4000-8000-000000000003'
const DIGITAL = '20000000-0000-4000-8000-000000000001'
const KEYRING = '20000000-0000-4000-8000-000000000002'
const LARGE = '20000000-0000-4000-8000-000000000003'
const SMALL = '20000000-0000-4000-8000-000000000004'
const PINK = '30000000-0000-4000-8000-000000000001'
const BIG_BAG = '30000000-0000-4000-8000-000000000002'
const LITTLE_BAG = '30000000-0000-4000-8000-000000000003'
const CART = '40000000-0000-4000-8000-000000000001'
const delivery: DeliveryDetails = {
  recipientName: 'Maya Sample', phone: '0821234567', addressLine1: '1 Sample Road',
  suburb: 'Sample suburb', city: 'Cape Town', province: 'Western Cape', postalCode: '7700', country: 'ZA',
}
const nameRule = [{ key: 'name', label: 'Name', type: 'text', required: true, constraints: { minLength: 1, maxLength: 12, allowedCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', allowSpaces: false } }]
const teacherRule = [{ key: 'teacherName', label: 'Teacher name', type: 'text', required: true, constraints: { maxLength: 60, allowSpaces: true } }]
const one = async <T>(sql: string, args: unknown[] = []): Promise<T> => {
  const row = (await db.query<{ result: T }>(sql, args)).rows[0]
  if (!row) throw new Error('Expected a SQL result row.')
  return row.result
}
const count = (table: 'orders' | 'payments' | 'inventory_reservations' | 'physical_cart_items' | 'coupon_redemptions') => one<number>(`select count(*)::integer as result from public.${table}`)
const stock = (id = PINK) => one<number>('select "onHand" as result from public.product_inventory where "variantId"=$1', [id])
const keyring = (overrides: Partial<PhysicalCartLine> = {}): PhysicalCartLine => ({ id: CART, productSlug: 'keyring', variantId: PINK, quantity: 1, customizations: { name: 'Ava' }, ...overrides })
interface Basket { lines?: PhysicalCartLine[]; digital?: string[]; coupon?: string | null; customer?: string; delivery?: unknown; shipping?: string | null }
const args = (basket: Basket) => [basket.customer ?? A, basket.digital ?? [], basket.lines ?? [keyring()], basket.coupon ?? null, basket.delivery === undefined ? delivery : basket.delivery, basket.shipping === undefined ? 'sample_delivery' : basket.shipping]
const quote = (basket: Basket = {}) => one<CommerceQuote>('select public.quote_commerce_order($1::uuid,$2::text[],$3::jsonb,$4::text,$5::jsonb,$6::text) as result', args(basket))
async function create(basket: Basket = {}, total?: number): Promise<CommerceCheckoutResponse> {
  const expected = total ?? (await quote(basket)).totalZar
  return one<CommerceCheckoutResponse>('select public.create_commerce_order($1::uuid,$2::text[],$3::jsonb,$4::text,$5::jsonb,$6::text,$7::text,$8::numeric) as result', [...args(basket), `DM-${crypto.randomUUID()}`, expected])
}
const complete = (order: CommerceCheckoutResponse, providerId = `SIM-${order.paymentId}`, amount = order.totalZar) =>
  one<string>('select public.complete_commerce_payment($1::uuid,$2::text,$3::numeric) as result', [order.paymentId, providerId, amount])
const cancel = (order: CommerceCheckoutResponse, customer = A) => one<boolean>('select public.cancel_commerce_order($1::uuid,$2::uuid) as result', [customer, order.orderId])
const purchase = (id: string) => one<{ status: string; fulfillmentStatus: string; items: unknown[]; delivery: unknown; shippingZar: number }>('select to_jsonb(o) as result from public.orders o where id=$1', [id])
const authenticate = async (user: string) => { await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${user}',false);`) }
const resetRole = () => db.exec('reset role; reset request.jwt.claim.sub;')

beforeAll(async () => {
  await db.exec(`create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    grant usage on schema auth to anon,authenticated,service_role;`)
  await db.exec(previousSchema.replace('create extension if not exists pgcrypto;', ''))
  await db.exec(patch)
  await db.exec(patch)
  for (const later of laterPatches) await db.exec(later)
  await db.exec(`insert into auth.users(id,email) values ('${A}','a@example.test'),('${B}','b@example.test'),('${ADMIN}','admin@example.test');
    update public.user_roles set role='admin' where "userId"='${ADMIN}';
    insert into public.products(id,slug,title,"priceZar",grade,term,year,"resourceFormat",subjects,"purchasedFiles",status)
      values('${DIGITAL}','maths','Digital maths',60,'Grade 4','Term 1','2026','Summary','{}','[{"id":"file","label":"Maths PDF","filename":"maths.pdf","storageKey":"private/maths.pdf"}]','queued');
    insert into public.products(id,slug,title,"priceZar","productType",status) values
      ('${KEYRING}','keyring','Name keyring',30,'physical','queued'),
      ('${LARGE}','large-bag','Large gift bag',235,'physical','queued'),
      ('${SMALL}','small-bag','Small gift bag',165,'physical','queued');`)
  await db.query(`update public.products set "pricingMode"='per_character',"pricingFieldKey"='name',"billableCharacters"='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',"customizationRules"=$1 where id=$2`, [nameRule, KEYRING])
  await db.query('update public.products set "customizationRules"=$1 where id=$2', [teacherRule, LARGE])
  await db.exec(`update public.products set "variantOptions"='[{"key":"colour","label":"Colour","display":"swatches","values":[{"value":"Pink","swatch":"#f3a0c2"}]}]' where id='${KEYRING}';
    update public.products set "variantOptions"='[{"key":"size","label":"Size","values":[{"value":"Large"}]}]' where id='${LARGE}';
    update public.products set "variantOptions"='[{"key":"size","label":"Size","values":[{"value":"Small"}]}]' where id='${SMALL}';`)
  await db.exec(`insert into public.product_variants(id,"productId",sku,"optionValues") values
    ('${PINK}','${KEYRING}','PINK','{"colour":"Pink"}'),('${BIG_BAG}','${LARGE}','LARGE','{"size":"Large"}'),('${LITTLE_BAG}','${SMALL}','SMALL','{"size":"Small"}');
    insert into public.coupons(code,"discountType",value,enabled,"allowSaleItems") values('SAMPLE10','percentage',10,true,true);
    select public.publish_site_content();`)
}, 60_000)

beforeEach(async () => {
  await resetRole()
  await db.exec(`truncate public.inventory_reservations,public.physical_cart_items,public.coupon_redemptions,public.payments,public.orders cascade;
    update public.product_inventory set "onHand"=3;
    update private.commerce_settings set mode='local_preview',"fixedShippingZar"=75,"shippingLabel"='Sample delivery',"shippingMethodId"='sample_delivery',"reservationTtlMinutes"=15,"physicalCouponPolicy"='digital_only',"latePaymentPolicy"='re_reserve_or_review';
    update public.products set title=case when id='${KEYRING}' then 'Name keyring' else title end,"salePriceZar"=null,"saleStartsAt"=null,"saleEndsAt"=null,status='queued';
    update public.product_variants set active=true,"unitPriceZar"=null;
    select public.publish_site_content();`)
})
afterAll(() => db.close())

describe('physical commerce pricing and access', () => {
  it('recreates the fresh schema with commerce disabled and intentional private-table access', async () => {
    const fresh = new PGlite()
    try {
      await fresh.exec(`create schema auth;
        create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',created_at timestamptz default now());
        create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
        create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
        grant usage on schema auth to anon,authenticated,service_role;`)
      await fresh.exec(schema.replace('create extension if not exists pgcrypto;', ''))
      // The full schema already includes the journey; replaying it and the
      // later patches, in order, remains safe.
      await fresh.exec(patch)
      for (const later of laterPatches) await fresh.exec(later)
      const settings = await fresh.query<{ mode: string; latePaymentPolicy: string | null }>('select mode,"latePaymentPolicy" from private.commerce_settings')
      expect(settings.rows).toEqual([{ mode: 'disabled', latePaymentPolicy: null }])
      const acl = await fresh.query<{ anon_stock: boolean; customer_holds: boolean; customer_cart: boolean }>(`select
        has_table_privilege('anon','public.product_inventory','select') as anon_stock,
        has_table_privilege('authenticated','public.inventory_reservations','select') as customer_holds,
        has_table_privilege('authenticated','public.physical_cart_items','insert') as customer_cart`)
      expect(acl.rows).toEqual([{ anon_stock: false, customer_holds: false, customer_cart: true }])
    } finally { await fresh.close() }
  }, 30_000)

  it('keeps disabled-by-default physical records out of public discovery and checkout', async () => {
    await db.exec(`update private.commerce_settings set mode='disabled'`)
    await db.exec('set role anon')
    expect(await one<number>('select count(*)::integer as result from public.catalog_physical_products')).toBe(0)
    expect(await one<{ enabled: boolean; localPreview: boolean }>('select to_jsonb(c) as result from public.commerce_public_context c')).toEqual({ enabled: false, localPreview: false })
    await expect(db.query('select * from public.product_inventory')).rejects.toThrow(/permission denied/)
    await expect(quote()).rejects.toThrow(/permission denied/)
    await resetRole()
    await expect(quote()).rejects.toThrow(/unavailable/)
  })

  it('exposes only published physical content and boolean availability, never stock counts', async () => {
    await db.exec('set role anon')
    const rows = await db.query<{ variants: Record<string, unknown>[] }>('select variants from public.catalog_physical_products')
    expect(rows.rows).toHaveLength(3)
    for (const row of rows.rows) for (const variant of row.variants) {
      expect(variant.available).toBe(true)
      expect(variant).not.toHaveProperty('onHand')
    }
  })

  it('prices three billable letters at R90, mixed shipping once, and coupon only on digital goods', async () => {
    expect(await quote()).toMatchObject({ subtotalZar: 90, shippingZar: 75, totalZar: 165, hasPhysical: true, localPreview: true })
    const mixed = await quote({ digital: ['maths'], coupon: 'SAMPLE10' })
    expect(mixed).toMatchObject({ subtotalZar: 150, discountZar: 6, shippingZar: 75, totalZar: 219, couponCode: 'SAMPLE10' })
    expect(mixed.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ productType: 'digital', quantity: 1, unitPriceZar: 60, priceZar: 60 }),
      expect.objectContaining({ productType: 'physical', quantity: 1, unitPriceZar: 90, priceZar: 90, customizations: { name: 'Ava' }, optionValues: { colour: 'Pink' } }),
    ]))
    await expect(quote({ coupon: 'SAMPLE10' })).rejects.toThrow(/digital products only/)
  })

  it('does not add shipping or delivery requirements to digital-only orders', async () => {
    const basket = { digital: ['maths'], lines: [], delivery: null, shipping: null }
    expect(await quote(basket)).toMatchObject({ subtotalZar: 60, shippingZar: 0, totalZar: 60, hasPhysical: false, shippingOption: null })
    const order = await create(basket)
    expect((await purchase(order.orderId)).delivery).toBeNull()
    expect(await complete(order)).toBe('processed')
  })

  it('rejects missing required teacher names, invalid name characters, quantities and untrusted fields', async () => {
    await expect(quote({ lines: [keyring({ productSlug: 'large-bag', variantId: BIG_BAG, customizations: { teacherName: '' } })] })).rejects.toThrow(/customization/)
    await expect(quote({ lines: [keyring({ customizations: { name: 'Ava-Li' } })] })).rejects.toThrow(/customization/)
    for (const quantity of [0, -1, 1.5, null]) {
      await expect(quote({ lines: [keyring({ quantity: quantity as number })] })).rejects.toThrow()
    }
    await expect(quote({ lines: [{ ...keyring(), priceZar: 1 } as PhysicalCartLine] })).rejects.toThrow()
    expect(await quote({ lines: [keyring({ productSlug: 'large-bag', variantId: BIG_BAG, customizations: { teacherName: 'Ms Jones' } })] })).toMatchObject({ subtotalZar: 235 })
  })

  it('supports physical base sale schedules and variant-rate overrides consistently', async () => {
    await db.exec(`update public.products set "salePriceZar"=20,status='queued' where id='${KEYRING}'; select public.publish_site_content()`)
    expect(await quote()).toMatchObject({ subtotalZar: 60 })
    await db.exec(`update public.product_variants set "unitPriceZar"=25 where id='${PINK}'; select public.publish_site_content()`)
    expect(await quote()).toMatchObject({ subtotalZar: 75 })
  })

  it('validates complete South African delivery data before creating a hold', async () => {
    for (const input of [null, {}, { ...delivery, country: undefined }, { ...delivery, postalCode: undefined }, { ...delivery, phone: '123' }]) {
      await expect(create({ delivery: input }, 165)).rejects.toThrow(/delivery|recipient|address/i)
    }
    expect(await count('orders')).toBe(0)
    expect(await count('inventory_reservations')).toBe(0)
  })
})

describe('atomic reservations and verified payment', () => {
  it('creates one pending hold, reuses the same mixed coupon checkout, and does not trust a changed total', async () => {
    const basket = { digital: ['maths'], coupon: 'SAMPLE10' }
    await expect(create(basket, 1)).rejects.toThrow(/Prices changed/)
    expect(await count('orders')).toBe(0)
    const order = await create(basket)
    expect(await stock()).toBe(3)
    expect(await count('inventory_reservations')).toBe(1)
    expect(await one<string>('select provider as result from public.payments where id=$1', [order.paymentId])).toBe('Simulation')
    expect(await create(basket)).toMatchObject({ orderId: order.orderId, paymentId: order.paymentId, totalZar: 219 })
    expect(await quote(basket)).toMatchObject({ totalZar: 219 })
    expect(await count('orders')).toBe(1)
    expect(await count('coupon_redemptions')).toBe(1)
  })

  it('rolls back the whole order and hold if payment persistence fails', async () => {
    await db.exec(`create function private.test_reject_payment() returns trigger language plpgsql as $$begin raise exception 'Simulated payment persistence failure'; end;$$;
      create trigger test_reject_payment before insert on public.payments for each row execute function private.test_reject_payment();`)
    try { await expect(create()).rejects.toThrow(/persistence failure/) }
    finally { await db.exec('drop trigger test_reject_payment on public.payments; drop function private.test_reject_payment()') }
    expect(await count('orders')).toBe(0)
    expect(await count('inventory_reservations')).toBe(0)
  })

  it('resumes a mixed coupon basket while correcting delivery without duplicating its order, hold or redemption', async () => {
    const basket = { digital: ['maths'], coupon: 'SAMPLE10' }
    const order = await create(basket)
    const originalFingerprint = await one<string>('select "commerceFingerprint" as result from public.orders where id=$1', [order.orderId])
    const oldHold = await one<{ quantity: number; expiresAt: string }>('select jsonb_build_object(\'quantity\',quantity,\'expiresAt\',"expiresAt") as result from public.inventory_reservations where "orderId"=$1', [order.orderId])

    // A checkout quote deliberately omits an address while the form is being edited.
    expect(await quote({ ...basket, delivery: null, shipping: null })).toMatchObject({ totalZar: 219, discountZar: 6 })
    const correctedDelivery = { ...delivery, addressLine1: '22 Corrected Road', postalCode: '8001' }
    const resumed = await create({ ...basket, delivery: correctedDelivery }, order.totalZar)
    expect(resumed).toMatchObject({ orderId: order.orderId, paymentId: order.paymentId, totalZar: 219 })
    expect((await purchase(order.orderId)).delivery).toEqual(correctedDelivery)
    expect(await one<string>('select "commerceFingerprint" as result from public.orders where id=$1', [order.orderId])).not.toBe(originalFingerprint)
    expect(await one<{ quantity: number; expiresAt: string }>('select jsonb_build_object(\'quantity\',quantity,\'expiresAt\',"expiresAt") as result from public.inventory_reservations where "orderId"=$1', [order.orderId])).toEqual(oldHold)
    expect(await count('orders')).toBe(1)
    expect(await count('payments')).toBe(1)
    expect(await count('inventory_reservations')).toBe(1)
    expect(await count('coupon_redemptions')).toBe(1)
    expect(await stock()).toBe(3)
  })

  it('deducts stock only once after matching verified payment and preserves extra cart quantities', async () => {
    await db.query('insert into public.physical_cart_items(id,"userId","productSlug","variantId",quantity,customizations) values($1,$2,$3,$4,2,$5)', [CART, A, 'keyring', PINK, { name: 'Ava' }])
    const order = await create()
    expect(await complete(order, 'wrong-amount', 1)).toBe('rejected')
    expect(await stock()).toBe(3)
    expect(await complete(order)).toBe('processed')
    expect(await stock()).toBe(2)
    expect(await complete(order)).toBe('duplicate')
    expect(await stock()).toBe(2)
    expect(await one<number>('select quantity as result from public.physical_cart_items where id=$1', [CART])).toBe(1)
    expect(await purchase(order.orderId)).toMatchObject({ status: 'paid', fulfillmentStatus: 'unfulfilled', shippingZar: 75, delivery })
  })

  it('releases failed/cancelled holds idempotently and denies another customer cancellation', async () => {
    const order = await create()
    expect(await cancel(order, B)).toBe(false)
    expect(await cancel(order)).toBe(true)
    expect(await cancel(order)).toBe(true)
    expect(await one<string>('select state as result from public.inventory_reservations where "orderId"=$1', [order.orderId])).toBe('released')
    expect(await stock()).toBe(3)
    expect(await complete(order)).toBe('rejected')
    const retry = await create()
    expect(retry.orderId).not.toBe(order.orderId)
    await db.query('update public.payments set status=$1 where id=$2', ['failed', retry.paymentId])
    expect((await purchase(retry.orderId)).status).toBe('failed')
    expect(await one<string>('select state as result from public.inventory_reservations where "orderId"=$1', [retry.orderId])).toBe('released')
  })

  it('allows only one last-unit checkout across competing customers', async () => {
    await db.exec(`update public.product_inventory set "onHand"=1 where "variantId"='${PINK}'`)
    const results = await Promise.allSettled([
      create(),
      create({ customer: B, lines: [keyring({ id: crypto.randomUUID(), customizations: { name: 'Ben' } })] }, 165),
    ])
    expect(results.filter((entry) => entry.status === 'fulfilled')).toHaveLength(1)
    expect(await count('orders')).toBe(1)
    expect(await stock()).toBe(1)
    expect(await one<number>('select count(*)::integer as result from public.catalog_physical_products p, jsonb_array_elements(p.variants) v where p.slug=$1 and (v->>\'available\')::boolean', ['keyring'])).toBe(0)
  })

  it('re-reserves an expired payment when stock remains available, then consumes it once', async () => {
    const order = await create()
    await db.query('update public.inventory_reservations set "expiresAt"=now()-interval \'1 minute\' where "orderId"=$1', [order.orderId])
    await db.query('update public.orders set "reservationExpiresAt"=now()-interval \'1 minute\' where id=$1', [order.orderId])
    const resumed = await create()
    expect(resumed.orderId).toBe(order.orderId)
    expect(Date.parse(resumed.reservationExpiresAt ?? '')).toBeGreaterThan(Date.now())
    expect(await complete(resumed)).toBe('processed')
    expect(await stock()).toBe(2)
  })

  it('rejects an expired checkout retry when its inventory record is missing', async () => {
    const order = await create()
    await db.query('update public.inventory_reservations set "expiresAt"=now()-interval \'1 minute\' where "orderId"=$1', [order.orderId])
    await db.query('update public.orders set "reservationExpiresAt"=now()-interval \'1 minute\' where id=$1', [order.orderId])
    await db.query('delete from public.product_inventory where "variantId"=$1', [PINK])
    try {
      await expect(create({}, order.totalZar)).rejects.toThrow(/no longer available/)
      expect(await count('orders')).toBe(1)
      expect(await count('payments')).toBe(1)
      expect((await purchase(order.orderId)).status).toBe('pending')
      expect(await one<boolean>('select "expiresAt" < now() as result from public.inventory_reservations where "orderId"=$1', [order.orderId])).toBe(true)
    } finally {
      await db.query('insert into public.product_inventory("variantId","onHand") values($1,3)', [PINK])
    }
  })

  it('records unavailable late verified payments for review without overselling or granting downloads', async () => {
    await db.exec(`update public.product_inventory set "onHand"=1 where "variantId"='${PINK}'`)
    const first = await create({ digital: ['maths'] })
    await db.query('update public.inventory_reservations set "expiresAt"=now()-interval \'1 minute\' where "orderId"=$1', [first.orderId])
    await db.query('update public.orders set "reservationExpiresAt"=now()-interval \'1 minute\' where id=$1', [first.orderId])
    const second = await create({ customer: B, lines: [keyring({ id: crypto.randomUUID(), customizations: { name: 'Ben' } })] })
    expect(await complete(second)).toBe('processed')
    expect(await stock()).toBe(0)
    await expect(create({ digital: ['maths'] }, first.totalZar)).rejects.toThrow(/no longer available/)
    expect(await complete(first)).toBe('review')
    expect(await complete(first)).toBe('review')
    expect(await stock()).toBe(0)
    expect(await purchase(first.orderId)).toMatchObject({ status: 'payment_review', fulfillmentStatus: 'review' })
    expect(await one<string>('select status as result from public.payments where id=$1', [first.paymentId])).toBe('succeeded')
  })
})

describe('admin stock, publication and fulfilment', () => {
  async function productDraft(): Promise<PhysicalProduct> {
    const result = await one<PhysicalProduct>('select to_jsonb(p) as result from public.products p where id=$1', [KEYRING])
    result.variants = (await db.query<{ result: NonNullable<PhysicalProduct['variants']>[number] }>('select (to_jsonb(v)-\'live\')||jsonb_build_object(\'onHand\',i."onHand") as result from public.product_variants v join public.product_inventory i on i."variantId"=v.id where v."productId"=$1', [KEYRING])).rows.map((entry) => entry.result)
    return result
  }
  const save = (product: PhysicalProduct) => one<PhysicalProduct>('select public.save_physical_product($1::jsonb,$2::jsonb) as result', [product, product.variants ?? []])
  const fulfill = (id: string, status: string, tracking = 'https://example.test/track/123') => one<{ status: string; fulfillmentStatus: string }>('select public.set_order_fulfillment($1::uuid,$2::text,$3::text,$4::text) as result', [id, status, 'SAMPLE-123', tracking])

  it('denies ordinary customer writes to admin stock and fulfilment RPCs', async () => {
    const draft = await productDraft()
    const order = await create()
    await complete(order)
    await authenticate(A)
    await expect(save(draft)).rejects.toThrow(/Administrator access/)
    await expect(fulfill(order.orderId, 'shipped')).rejects.toThrow(/Administrator access/)
  })

  it('preserves published content on stock-only saves and requires current counts for stock changes', async () => {
    const draft = await productDraft()
    draft.variants![0]!.stockAdjustment = { expectedOnHand: 3, newOnHand: 5 }
    await authenticate(ADMIN)
    await save(draft)
    await resetRole()
    expect(await stock()).toBe(5)
    expect(await one<string>('select status as result from public.products where id=$1', [KEYRING])).toBe('published')
    await authenticate(ADMIN)
    await expect(save(draft)).rejects.toThrow(/Stock changed/)
    await resetRole()
    expect(await stock()).toBe(5)
  })

  it('does not overwrite stock from an old ordinary product snapshot or lower it below active reservations', async () => {
    const draft = await productDraft()
    draft.variants![0]!.onHand = 99
    const order = await create({ lines: [keyring({ quantity: 2 })] })
    await authenticate(ADMIN)
    await save(draft)
    await resetRole()
    expect(await stock()).toBe(3)
    draft.variants![0]!.stockAdjustment = { expectedOnHand: 3, newOnHand: 1 }
    await authenticate(ADMIN)
    await expect(save(draft)).rejects.toThrow(/reserved/)
    await resetRole()
    expect((await purchase(order.orderId)).status).toBe('pending')
    expect(await stock()).toBe(3)
  })

  it('ships only paid physical orders, enforces transitions and safe tracking links', async () => {
    const order = await create()
    await authenticate(ADMIN)
    await expect(fulfill(order.orderId, 'shipped')).rejects.toThrow(/paid physical/)
    await resetRole()
    await complete(order)
    await authenticate(ADMIN)
    await expect(fulfill(order.orderId, 'delivered')).rejects.toThrow(/not allowed/)
    await expect(fulfill(order.orderId, 'shipped', 'javascript:alert(1)')).rejects.toThrow(/HTTPS/)
    expect(await fulfill(order.orderId, 'shipped')).toMatchObject({ status: 'paid', fulfillmentStatus: 'shipped' })
    expect(await fulfill(order.orderId, 'delivered')).toMatchObject({ status: 'fulfilled', fulfillmentStatus: 'delivered' })
  })

  it('keeps customer physical-cart rows private and owner-scoped', async () => {
    await authenticate(A)
    await db.query('insert into public.physical_cart_items(id,"userId","productSlug","variantId",quantity,customizations) values($1,$2,$3,$4,1,$5)', [CART, A, 'keyring', PINK, { name: 'Ava' }])
    await resetRole()
    await authenticate(B)
    expect(await count('physical_cart_items')).toBe(0)
    await expect(db.query('insert into public.physical_cart_items("userId","productSlug","variantId",quantity,customizations) values($1,$2,$3,1,$4)', [A, 'keyring', PINK, { name: 'Ben' }])).rejects.toThrow(/row-level security/)
    expect((await db.query('delete from public.physical_cart_items where id=$1 returning id', [CART])).rows).toEqual([])
    await resetRole()
    expect(await count('physical_cart_items')).toBe(1)
  })
})
