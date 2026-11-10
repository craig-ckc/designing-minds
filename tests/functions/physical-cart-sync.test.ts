import { expect, it, vi } from 'vitest'
vi.mock('../../apps/web/src/lib/supabase.ts', () => ({ supabase: null }))
import { addPhysicalCartLine, clearLocalPhysicalCart, consumePurchasedPhysicalCart, createPhysicalCartStore, createPhysicalCartSync, getPhysicalCartLines, type PhysicalCartServer } from '../../apps/web/src/lib/physical-cart.ts'
import type { PhysicalCartLine } from '../../packages/cms/src/lib/commerce.ts'

const line = (id: string, quantity = 1, name = 'Ava'): PhysicalCartLine => ({ id, productSlug: 'keyring', variantId: 'pink', quantity, customizations: { name } })
const pending = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done }); return { promise, resolve } }
function fixture(initial: PhysicalCartLine[] = []) {
  const store = createPhysicalCartStore({ backend: null, cartKey: 'cart', ownerKey: 'owner' })
  store.write(initial)
  let user: string | null = null
  let remote: PhysicalCartLine[] = []
  const writes: PhysicalCartLine[][] = []
  const server: PhysicalCartServer = { currentCustomerId: async () => user, readCart: async () => remote, writeCart: async (_owner, lines) => { remote = structuredClone([...lines]); writes.push(remote) } }
  let id = 0
  const cart = createPhysicalCartSync({ storage: store, server, idFactory: () => `line-${++id}` })
  return { store, server, cart, writes, setUser: (value: string | null) => { user = value }, setRemote: (value: PhysicalCartLine[]) => { remote = value } }
}

it('merges equal configurations by quantity, retaining different names as separate rows', async () => {
  const { cart } = fixture()
  cart.add({ productSlug: 'keyring', variantId: 'pink', quantity: 1, customizations: { name: 'Ava' } })
  cart.add({ productSlug: 'keyring', variantId: 'pink', quantity: 2, customizations: { name: 'Ava' } })
  cart.add({ productSlug: 'keyring', variantId: 'pink', quantity: 1, customizations: { name: 'Liam' } })
  expect(cart.read().map((entry) => [entry.customizations.name, entry.quantity])).toEqual([['Ava', 3], ['Liam', 1]])
  expect(() => cart.update('line-1', 1.5)).toThrow(/whole number/)
  expect(() => cart.add({ productSlug: 'keyring', variantId: 'pink', quantity: -1, customizations: {} })).toThrow()
  await cart.settled()
})

it('does not lose an increment made while a matching remote row is merging', async () => {
  const f = fixture([line('guest')]); f.setUser('customer')
  const read = pending<PhysicalCartLine[]>()
  f.server.readCart = () => read.promise
  const merge = f.cart.merge('customer')
  await Promise.resolve(); await Promise.resolve()
  f.cart.add({ productSlug: 'keyring', variantId: 'pink', quantity: 1, customizations: { name: 'Ava' } })
  read.resolve([line('remote', 2)])
  await merge; await f.cart.settled()
  expect(f.cart.read()).toMatchObject([{ id: 'remote', quantity: 4 }])
})

it('lets clear win over a delayed account read', async () => {
  const f = fixture([line('guest')]); f.setUser('customer')
  const read = pending<PhysicalCartLine[]>(); f.server.readCart = () => read.promise
  const merge = f.cart.merge('customer')
  await Promise.resolve(); await Promise.resolve()
  f.cart.clear()
  read.resolve([line('remote', 2)])
  await merge; await f.cart.settled()
  expect(f.cart.read()).toEqual([])
  expect(f.writes.at(-1)).toEqual([])
})

it('does not restore another account after sign-out during a merge', async () => {
  const f = fixture([line('old')]); f.store.writeOwner('old-customer'); f.setUser('old-customer')
  const read = pending<PhysicalCartLine[]>(); f.server.readCart = () => read.promise
  const merge = f.cart.merge('old-customer')
  await Promise.resolve(); await Promise.resolve()
  f.cart.clearLocal(); f.setUser(null)
  read.resolve([line('remote')])
  await merge; await f.cart.settled()
  expect(f.cart.read()).toEqual([])
  expect(f.store.readOwner()).toBeNull()
  expect(f.writes).toEqual([])
})

it('keeps account rows separate from a previous customer’s browser cart', async () => {
  const f = fixture([line('old')]); f.store.writeOwner('previous'); f.setUser('next'); f.setRemote([line('new', 1, 'Liam')])
  f.cart.prepareCustomer('next')
  await f.cart.merge('next')
  expect(f.cart.read().map((entry) => entry.customizations.name)).toEqual(['Liam'])
})

it('notifies cross-tab owner changes even when the rows are identical', () => {
  const data = new Map<string, string>([['cart', JSON.stringify([line('a')])], ['owner', 'old']])
  const backend = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) }, removeItem: (key: string) => { data.delete(key) } }
  const store = createPhysicalCartStore({ backend, cartKey: 'cart', ownerKey: 'owner' })
  store.read(); expect(store.readOwner()).toBe('old')
  const changed = vi.fn(); store.subscribe(changed)
  data.set('owner', 'new'); store.refresh()
  expect(store.readOwner()).toBe('new'); expect(changed).toHaveBeenCalledOnce()
})

it('a failed merge does not corrupt the next merge window', async () => {
  const f = fixture([line('guest')]); f.setUser('customer')
  f.server.writeCart = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
  await expect(f.cart.merge('customer')).rejects.toThrow('offline')
  const read = pending<PhysicalCartLine[]>()
  f.server.readCart = () => read.promise
  const secondMerge = f.cart.merge('customer')
  await Promise.resolve(); await Promise.resolve()
  f.cart.add({ productSlug: 'keyring', variantId: 'pink', quantity: 1, customizations: { name: 'Liam' } })
  read.resolve([])
  await secondMerge
  await f.cart.settled()
  expect(f.cart.read()).toHaveLength(2)
})

it('consumes only purchased quantities and consumes each order once', () => {
  clearLocalPhysicalCart()
  const purchase = addPhysicalCartLine({ productSlug: 'keyring', variantId: 'pink', quantity: 3, customizations: { name: 'Ava' } })
  const untouched = addPhysicalCartLine({ productSlug: 'keyring', variantId: 'blue', quantity: 1, customizations: { name: 'Liam' } })
  const items = [{ id: 'order-item', productSlug: 'keyring', title: 'Name keyring', productKind: 'Physical' as const, productType: 'physical' as const, priceZar: 180, quantity: 2, cartLineId: purchase.id }]
  consumePurchasedPhysicalCart('sample-order-quantity', items)
  expect(getPhysicalCartLines().find((entry) => entry.id === purchase.id)?.quantity).toBe(1)
  expect(getPhysicalCartLines().find((entry) => entry.id === untouched.id)?.quantity).toBe(1)
  consumePurchasedPhysicalCart('sample-order-quantity', items)
  expect(getPhysicalCartLines().find((entry) => entry.id === purchase.id)?.quantity).toBe(1)
  clearLocalPhysicalCart()
})
