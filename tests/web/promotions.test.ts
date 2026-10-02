import assert from 'node:assert/strict'
import test from 'node:test'
import { promotionPrice, promotionValidation, fromJohannesburgInput, toJohannesburgInput } from '../../packages/cms/src/lib/promotions.ts'
const now = Date.parse('2026-10-02T10:00:00Z')
test('sale prices include the start and exclude the end; no dates means immediately active', () => {
  assert.equal(promotionPrice({ priceZar: 100, salePriceZar: 80 }, now), 80)
  assert.equal(promotionPrice({ priceZar: 100, salePriceZar: 80, saleStartsAt: '2026-10-02T10:00:00Z' }, now), 80)
  assert.equal(promotionPrice({ priceZar: 100, salePriceZar: 80, saleEndsAt: '2026-10-02T10:00:00Z' }, now), 100)
  assert.equal(promotionPrice({ priceZar: 100, salePriceZar: 80, saleStartsAt: '2026-10-03T10:00:00Z' }, now), 100)
})
test('invalid or absent sale settings never discount a product', () => {
  for (const salePriceZar of [null, undefined, 0, -1, 100, 101, NaN, Infinity]) assert.equal(promotionPrice({ priceZar: 100, salePriceZar }, now), 100)
  assert.equal(promotionPrice({ priceZar: 100, salePriceZar: 80, saleStartsAt: 'bad date' }, now),100)
})
test('the admin rejects invalid money, schedules and codes before saving', () => {
  assert.equal(promotionValidation('products', { priceZar: 100, salePriceZar: 80 }), null)
  for (const salePriceZar of [0,-1,100,101,NaN,Infinity,80.001]) assert.ok(promotionValidation('bundles',{ priceZar: 100,salePriceZar }))
  assert.ok(promotionValidation('products',{priceZar:100,salePriceZar:80,saleStartsAt:'2026-10-02T12:00:00Z',saleEndsAt:'2026-10-02T11:00:00Z'}))
  assert.equal(promotionValidation('coupons',{code:' summer10 ',discountType:'percentage',value:10}),null)
  for (const value of [0,-1,101,NaN,Infinity,10.001]) assert.ok(promotionValidation('coupons',{code:'SAVE',discountType:'percentage',value}))
  assert.ok(promotionValidation('coupons',{code:'BAD CODE',discountType:'fixed',value:1}))
  assert.ok(promotionValidation('coupons',{code:'SAVE',discountType:'invalid',value:1}))
})
test('promotion dates use South African time regardless of the admin browser timezone', () => {
  assert.equal(toJohannesburgInput('2026-10-02T10:30:00Z'),'2026-10-02T12:30')
  assert.equal(fromJohannesburgInput('2026-10-02T12:30'),'2026-10-02T10:30:00.000Z')
  assert.equal(fromJohannesburgInput(''),null)
  assert.equal(toJohannesburgInput(null),'')
})
test('currency labels retain cents in percentage-discounted prices', async () => {
  const { priceLabel } = await import('../../packages/cms/src/lib/formatters.ts')
  assert.match(priceLabel(80.55), /80,55/)
})
test('a pricing snapshot hydrates at its build time, then advances without changing regular prices', async () => {
  const { withPricingTime, duplicateCouponCode } = await import('../../packages/cms/src/lib/promotions.ts')
  const source = { products: [{priceZar:100,salePriceZar:80,saleStartsAt:'2026-10-02T10:00:00Z'}], bundles: [] } as any
  const built = withPricingTime(source,Date.parse('2026-10-01T10:00:00Z'))
  const current = withPricingTime(built,now)
  assert.equal(promotionPrice(built.products[0]),100)
  assert.equal(promotionPrice(current.products[0]),80)
  assert.equal(current.products[0].priceZar,100)
  assert.equal(source.products[0].priceAsOf,undefined)
  assert.match(duplicateCouponCode('SAVE10','abcdef12-0000-4000-8000-000000000000'), /^SAVE10_ABCDEF12$/)
  assert.equal(duplicateCouponCode('A'.repeat(40),'abcdef12-0000-4000-8000-000000000000').length,40)
})
