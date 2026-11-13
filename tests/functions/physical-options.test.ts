import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { CommerceCheckoutResponse, CommerceQuote, DeliveryDetails, PhysicalCartLine } from '../../packages/cms/src/index.ts'

/* The 2026-11-12 option model, proven against real Postgres (PGlite) with the
   two first physical products: a clicker letter keyring (per-letter price,
   colours, a paid font choice, one colour made to order) and a teacher gift
   bag (Small / Large, the teacher's name asked only for Large). */

const read = (name: string) => readFileSync(new URL(`../../supabase/${name}`, import.meta.url), 'utf8')
const db = new PGlite()
const A = '10000000-0000-4000-8000-000000000001'
const ADMIN = '10000000-0000-4000-8000-000000000003'
const DIGITAL = '20000000-0000-4000-8000-000000000001'
const KEYRING = '20000000-0000-4000-8000-000000000002'
const BAG = '20000000-0000-4000-8000-000000000003'
const PINK = '30000000-0000-4000-8000-000000000001'
const BLUE = '30000000-0000-4000-8000-000000000002'
const SMALL = '30000000-0000-4000-8000-000000000003'
const LARGE = '30000000-0000-4000-8000-000000000004'
const LINE = '40000000-0000-4000-8000-000000000001'
const LINE_2 = '40000000-0000-4000-8000-000000000002'
const delivery: DeliveryDetails = {
  recipientName: 'Maya Sample', phone: '0821234567', addressLine1: '1 Sample Road',
  suburb: 'Sample suburb', city: 'Cape Town', province: 'Western Cape', postalCode: '7700', country: 'ZA',
}
const keyringOptions = [{ key: 'colour', label: 'Colour', display: 'swatches', values: [{ value: 'Pink', swatch: '#f3a0c2' }, { value: 'Blue', swatch: '#3b82f6' }] }]
const keyringRules = [
  { key: 'name', label: 'Name', type: 'text', required: true, transform: 'uppercase', constraints: { minLength: 1, maxLength: 10, allowedCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', allowSpaces: false } },
  { key: 'font', label: 'Letter style', type: 'select', required: false, display: 'buttons', options: [{ value: 'Classic' }, { value: 'Rounded', label: 'Rounded letters', priceDeltaZar: 10 }] },
]
const bagOptions = [{ key: 'size', label: 'Bag size', values: [{ value: 'Small' }, { value: 'Large' }] }]
const bagRules = [{ key: 'teacherName', label: 'Teacher’s name', type: 'text', required: true, appliesWhen: { size: ['Large'] }, constraints: { maxLength: 30, allowSpaces: true } }]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const one = async <T = any>(sql: string, args: unknown[] = []): Promise<T> => {
  const row = (await db.query<{ result: T }>(sql, args)).rows[0]
  if (!row) throw new Error('Expected a SQL result row.')
  return row.result
}
const line = (overrides: Partial<PhysicalCartLine> = {}): PhysicalCartLine => ({ id: LINE, productSlug: 'keyring', variantId: PINK, quantity: 1, customizations: { name: 'Ava' }, ...overrides })
interface Basket { lines?: PhysicalCartLine[]; digital?: string[]; coupon?: string | null }
const args = (basket: Basket) => [A, basket.digital ?? [], basket.lines ?? [line()], basket.coupon ?? null, delivery, 'sample_delivery']
const quote = (basket: Basket = {}) => one<CommerceQuote>('select public.quote_commerce_order($1::uuid,$2::text[],$3::jsonb,$4::text,$5::jsonb,$6::text) as result', args(basket))
async function create(basket: Basket = {}): Promise<CommerceCheckoutResponse> {
  const expected = (await quote(basket)).totalZar
  return one<CommerceCheckoutResponse>('select public.create_commerce_order($1::uuid,$2::text[],$3::jsonb,$4::text,$5::jsonb,$6::text,$7::text,$8::numeric) as result', [...args(basket), `DM-${crypto.randomUUID()}`, expected])
}
const complete = (order: CommerceCheckoutResponse) =>
  one<string>('select public.complete_commerce_payment($1::uuid,$2::text,$3::numeric) as result', [order.paymentId, `SIM-${order.paymentId}`, order.totalZar])
const stock = (id: string) => one<number>('select "onHand" as result from public.product_inventory where "variantId"=$1', [id])
const asAdmin = () => db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${ADMIN}',false);`)
const asCustomer = () => db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${A}',false);`)
const resetRole = () => db.exec('reset role; reset request.jwt.claim.sub;')
const publish = () => db.exec('update public.products set status=\'queued\'; select public.publish_site_content();')

beforeAll(async () => {
  await db.exec(`create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    grant usage on schema auth to anon,authenticated,service_role;`)
  await db.exec(read('schema.sql').replace('create extension if not exists pgcrypto;', ''))
  await db.exec(`insert into auth.users(id,email) values ('${A}','a@example.test'),('${ADMIN}','admin@example.test');
    update public.user_roles set role='admin' where "userId"='${ADMIN}';
    insert into public.products(id,slug,title,"priceZar",grade,term,year,"resourceFormat",subjects,"purchasedFiles",status)
      values('${DIGITAL}','maths','Digital maths',60,'Grade 4','Term 1','2026','Summary','{}','[]','queued');
    insert into public.products(id,slug,title,"priceZar","productType",status) values
      ('${KEYRING}','keyring','Clicker keyring',30,'physical','queued'),
      ('${BAG}','teacher-bag','Teacher gift bag',165,'physical','queued');`)
  await db.query(`update public.products set "variantOptions"=$1,"customizationRules"=$2,"pricingMode"='per_character',"pricingFieldKey"='name',"billableCharacters"='ABCDEFGHIJKLMNOPQRSTUVWXYZ',"leadTimeDays"=7,"previewTemplate"='letter-tiles' where id=$3`, [keyringOptions, keyringRules, KEYRING])
  await db.query('update public.products set "variantOptions"=$1,"customizationRules"=$2 where id=$3', [bagOptions, bagRules, BAG])
  await db.exec(`insert into public.product_variants(id,"productId",sku,"optionValues","inventoryPolicy","unitPriceZar") values
    ('${PINK}','${KEYRING}','PINK','{"colour":"Pink"}','tracked',null),
    ('${BLUE}','${KEYRING}','BLUE','{"colour":"Blue"}','made_to_order',null),
    ('${SMALL}','${BAG}','SMALL','{"size":"Small"}','tracked',null),
    ('${LARGE}','${BAG}','LARGE','{"size":"Large"}','made_to_order',235);
    insert into public.coupons(code,"discountType",value,enabled,"allowSaleItems") values('SAVE10','percentage',10,true,false);`)
}, 60_000)

beforeEach(async () => {
  await resetRole()
  await db.exec(`truncate public.inventory_reservations,public.physical_cart_items,public.coupon_redemptions,public.payments,public.orders cascade;
    update public.product_inventory set "onHand"=2;
    update private.commerce_settings set mode='local_preview',"fixedShippingZar"=75,"shippingLabel"='Sample delivery',"shippingMethodId"='sample_delivery',"reservationTtlMinutes"=15,"physicalCouponPolicy"='all_products',"latePaymentPolicy"='re_reserve_or_review';
    update public.products set "salePriceZar"=null,"saleStartsAt"=null,"saleEndsAt"=null;`)
  await publish()
})
afterAll(() => db.close())

describe('declared options', () => {
  it('rejects variants that use undeclared values or repeat an active combination', async () => {
    await expect(db.exec(`insert into public.product_variants(id,"productId","optionValues") values (gen_random_uuid(),'${KEYRING}','{"colour":"Green"}')`)).rejects.toThrow(/offered values/)
    await expect(db.exec(`insert into public.product_variants(id,"productId","optionValues") values (gen_random_uuid(),'${KEYRING}','{"shade":"Pink"}')`)).rejects.toThrow(/offered values/)
    await expect(db.exec(`insert into public.product_variants(id,"productId","optionValues") values (gen_random_uuid(),'${KEYRING}','{"colour":"Pink"}')`)).rejects.toThrow(/unique|duplicate/i)
  })

  it('rejects questions that clash with options or depend on undeclared ones', async () => {
    const clash = [...keyringRules, { key: 'colour', label: 'Colour again', type: 'text', required: false }]
    await expect(db.query('update public.products set "customizationRules"=$1 where id=$2', [clash, KEYRING])).rejects.toThrow(/physical_configuration/)
    const unknownCondition = [{ ...bagRules[0], appliesWhen: { size: ['Huge'] } }]
    await expect(db.query('update public.products set "customizationRules"=$1 where id=$2', [unknownCondition, BAG])).rejects.toThrow(/physical_configuration/)
    const conditionalPricing = [{ ...keyringRules[0], appliesWhen: { colour: ['Pink'] } }, keyringRules[1]]
    await expect(db.query('update public.products set "customizationRules"=$1 where id=$2', [conditionalPricing, KEYRING])).rejects.toThrow(/physical_configuration/)
    await expect(db.query('update public.products set "variantOptions"=$1 where id=$2', [[{ key: 'colour', label: 'Colour', values: [{ value: 'Pink', swatch: 'pink' }] }], KEYRING])).rejects.toThrow()
  })

  it('publishes options, swatches, lead time, preview template and made-to-order availability without stock counts', async () => {
    await db.exec(`update public.product_inventory set "onHand"=0`)
    const row = await one('select to_jsonb(c) as result from public.catalog_physical_products c where slug=\'keyring\'')
    expect(row.variantOptions).toEqual(keyringOptions)
    expect(row.leadTimeDays).toBe(7)
    expect(row.previewTemplate).toBe('letter-tiles')
    expect(row.variants).toEqual([
      expect.objectContaining({ id: PINK, available: false, madeToOrder: false }),
      expect.objectContaining({ id: BLUE, available: true, madeToOrder: true }),
    ])
    expect(JSON.stringify(row)).not.toContain('onHand')
  })
})

describe('pricing', () => {
  it('counts billable letters case-insensitively, stores the name in capitals and adds a chosen style once per item', async () => {
    const plain = await quote()
    expect(plain.items[0]).toMatchObject({ unitPriceZar: 90, priceZar: 90, customizations: { name: 'AVA' }, productId: KEYRING, inventoryPolicy: 'tracked' })
    expect(plain.items[0]).toMatchObject({ fieldLabels: { colour: 'Colour', name: 'Name', font: 'Letter style' } })
    const styled = await quote({ lines: [line({ quantity: 2, customizations: { name: 'ava', font: 'Rounded' } })] })
    expect(styled.items[0]).toMatchObject({ unitPriceZar: 100, priceZar: 200, customizations: { name: 'AVA', font: 'Rounded' } })
    expect(styled.totalZar).toBe(275)
  })

  it('rejects a name with no billable letter and an unknown style', async () => {
    await expect(quote({ lines: [line({ customizations: { name: '' } })] })).rejects.toThrow(/customization|billable/)
    await expect(quote({ lines: [line({ customizations: { name: 'Ava', font: 'Gothic' } })] })).rejects.toThrow(/customization/)
  })

  it('asks for the teacher’s name only on the Large bag and keeps its own price', async () => {
    const small = await quote({ lines: [line({ productSlug: 'teacher-bag', variantId: SMALL, customizations: { teacherName: 'Mrs Minnie' } })] })
    expect(small.items[0]).toMatchObject({ unitPriceZar: 165, customizations: {} })
    await expect(quote({ lines: [line({ productSlug: 'teacher-bag', variantId: LARGE, customizations: {} })] })).rejects.toThrow(/customization/)
    const large = await quote({ lines: [line({ productSlug: 'teacher-bag', variantId: LARGE, customizations: { teacherName: 'Mrs Minnie' } })] })
    expect(large.items[0]).toMatchObject({ unitPriceZar: 235, customizations: { teacherName: 'Mrs Minnie' }, inventoryPolicy: 'made_to_order' })
  })
})

describe('made to order', () => {
  it('sells with no stock, holds nothing, and completes payment as paid', async () => {
    await db.exec(`update public.product_inventory set "onHand"=0`)
    const order = await create({ lines: [line({ variantId: BLUE })] })
    expect(await one<number>('select count(*)::int as result from public.inventory_reservations')).toBe(0)
    expect(await complete(order)).toBe('processed')
    expect(await one('select status as result from public.orders where id=$1', [order.orderId])).toBe('paid')
    expect(await stock(BLUE)).toBe(0)
  })

  it('still holds and deducts stock-counted lines in the same order', async () => {
    const order = await create({ lines: [line({ variantId: BLUE }), line({ id: LINE_2, variantId: PINK, customizations: { name: 'Leah' } })] })
    expect(await one<number>('select count(*)::int as result from public.inventory_reservations')).toBe(1)
    expect(await complete(order)).toBe('processed')
    expect(await stock(PINK)).toBe(1)
  })
})

describe('discount codes on physical lines', () => {
  it('discounts physical-only baskets on items, never shipping', async () => {
    const result = await quote({ coupon: 'save10' })
    expect(result).toMatchObject({ subtotalZar: 90, discountZar: 9, shippingZar: 75, totalZar: 156, couponCode: 'SAVE10' })
  })

  it('discounts digital and physical lines together and reserves the code once', async () => {
    const order = await create({ digital: ['maths'], coupon: 'SAVE10' })
    expect(order).toMatchObject({ subtotalZar: 150, discountZar: 15, totalZar: 210 })
    expect(await one<number>('select count(*)::int as result from public.coupon_redemptions')).toBe(1)
    await expect(quote({ lines: [line({ id: LINE_2 })], coupon: 'SAVE10' })).rejects.toThrow(/reserved for a pending checkout/)
  })

  it('leaves sale-priced lines out unless the code allows sale items', async () => {
    await db.exec(`update public.products set "salePriceZar"=20 where id='${KEYRING}'`)
    await publish()
    await expect(quote({ coupon: 'SAVE10' })).rejects.toThrow(/already on sale/)
  })

  it('keeps the stricter digital-only policy available', async () => {
    await db.exec(`update private.commerce_settings set "physicalCouponPolicy"='digital_only'`)
    await expect(quote({ coupon: 'SAVE10' })).rejects.toThrow(/digital products only/)
  })
})

describe('resolving a stock review', () => {
  async function reviewOrder(): Promise<CommerceCheckoutResponse> {
    const order = await create({ digital: ['maths'] })
    // Simulate stock disappearing before a late payment.
    await db.exec(`update public.inventory_reservations set state='released'; update public.product_inventory set "onHand"=0 where "variantId"='${PINK}'`)
    expect(await complete(order)).toBe('review')
    return order
  }

  it('only lets administrators resolve, and only fulfils once stock exists', async () => {
    const order = await reviewOrder()
    await asCustomer()
    await expect(db.query(`select public.resolve_payment_review($1,'fulfil')`, [order.orderId])).rejects.toThrow(/Administrator/)
    await asAdmin()
    await expect(db.query(`select public.resolve_payment_review($1,'fulfil')`, [order.orderId])).rejects.toThrow(/not enough stock/)
    await resetRole()
    await db.exec(`update public.product_inventory set "onHand"=3 where "variantId"='${PINK}'`)
    await asAdmin()
    const resolved = await one(`select public.resolve_payment_review($1,'fulfil') as result`, [order.orderId])
    expect(resolved).toMatchObject({ status: 'paid', fulfillmentStatus: 'unfulfilled' })
    await resetRole()
    expect(await stock(PINK)).toBe(2)
  })

  it('records an outside refund and cancels dispatch', async () => {
    const order = await reviewOrder()
    await asAdmin()
    const resolved = await one(`select public.resolve_payment_review($1,'refunded') as result`, [order.orderId])
    expect(resolved).toMatchObject({ status: 'refunded', fulfillmentStatus: 'cancelled' })
    await resetRole()
    expect(await one('select status as result from public.payments where id=$1', [order.paymentId])).toBe('refunded')
    await asAdmin()
    await expect(db.query(`select public.resolve_payment_review($1,'fulfil')`, [order.orderId])).rejects.toThrow(/awaiting a stock review/)
  })
})

describe('admin save', () => {
  const base = async () => {
    await asAdmin()
    const product = await one('select (to_jsonb(p)-\'live\') as result from public.products p where id=$1', [KEYRING])
    const variants = (await db.query<{ result: Record<string, unknown> }>('select (to_jsonb(v)-\'live\')||jsonb_build_object(\'onHand\',i."onHand") as result from public.product_variants v join public.product_inventory i on i."variantId"=v.id where v."productId"=$1 order by v."sortOrder",v.id', [KEYRING])).rows.map((row) => row.result)
    return { product, variants }
  }
  const save = (product: unknown, variants: unknown) => one('select public.save_physical_product($1::jsonb,$2::jsonb) as result', [product, variants])

  it('saves declared options, lead time, preview and stock policy', async () => {
    const { product, variants } = await base()
    const saved = await save({ ...product, leadTimeDays: 10 }, variants.map((variant) => variant.id === PINK ? { ...variant, inventoryPolicy: 'made_to_order' } : variant))
    expect(saved).toMatchObject({ leadTimeDays: 10, previewTemplate: 'letter-tiles', variantOptions: keyringOptions })
    expect(saved.variants.find((variant: { id: string }) => variant.id === PINK)).toMatchObject({ inventoryPolicy: 'made_to_order' })
    await save(product, variants)
  })

  it('refuses to drop an offered value that an available option still uses', async () => {
    const { product, variants } = await base()
    const withoutBlue = [{ ...keyringOptions[0], values: [keyringOptions[0].values[0]] }]
    await expect(save({ ...product, variantOptions: withoutBlue }, variants.filter((variant) => variant.id !== BLUE))).rejects.toThrow(/no longer offers/)
  })

describe('review fixes', () => {
  it('never lets a code make the items free, even with shipping to pay', async () => {
    await db.exec(`insert into public.coupons(code,"discountType",value,enabled,"allowSaleItems") values('ALLFREE','percentage',100,true,true) on conflict do nothing`)
    await expect(quote({ digital: ['maths'], coupon: 'ALLFREE' })).rejects.toThrow(/would make the order free/)
  })

  it('records a physical-only refund on a mixed order without locking its digital items', async () => {
    const order = await create({ digital: ['maths'] })
    await db.exec(`update public.inventory_reservations set state='released'; update public.product_inventory set "onHand"=0 where "variantId"='${PINK}'`)
    expect(await complete(order)).toBe('review')
    await asAdmin()
    const resolved = await one(`select public.resolve_payment_review($1,'cancel_physical') as result`, [order.orderId])
    expect(resolved).toMatchObject({ status: 'paid', fulfillmentStatus: 'cancelled' })
    await resetRole()
    expect(await one('select status as result from public.payments where id=$1', [order.paymentId])).toBe('succeeded')
  })

  it('refuses a physical-only refund for an order with nothing digital', async () => {
    const order = await create()
    await db.exec(`update public.inventory_reservations set state='released'; update public.product_inventory set "onHand"=0 where "variantId"='${PINK}'`)
    expect(await complete(order)).toBe('review')
    await asAdmin()
    await expect(db.query(`select public.resolve_payment_review($1,'cancel_physical')`, [order.orderId])).rejects.toThrow(/no digital items/)
  })

  it('lets a variant that is turned off keep a value the product stops offering', async () => {
    await asAdmin()
    const product = await one('select (to_jsonb(p)-\'live\') as result from public.products p where id=$1', [KEYRING])
    const variants = (await db.query<{ result: Record<string, unknown> }>('select (to_jsonb(v)-\'live\')||jsonb_build_object(\'onHand\',i."onHand") as result from public.product_variants v join public.product_inventory i on i."variantId"=v.id where v."productId"=$1', [KEYRING])).rows.map((row) => row.result)
    const pinkOnly = [{ ...keyringOptions[0], values: [keyringOptions[0].values[0]] }]
    const saved = await one('select public.save_physical_product($1::jsonb,$2::jsonb) as result', [{ ...product, variantOptions: pinkOnly }, variants.map((variant) => variant.id === BLUE ? { ...variant, active: false } : variant)])
    expect(saved.variantOptions).toEqual(pinkOnly)
    await one('select public.save_physical_product($1::jsonb,$2::jsonb) as result', [product, variants])
  })
})
})
