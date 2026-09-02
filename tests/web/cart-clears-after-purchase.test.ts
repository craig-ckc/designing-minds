import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createCartSync, type CartServer, type CartStorage } from '../../apps/web/src/lib/cart-sync.ts'

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

// --- Fakes ---------------------------------------------------------------

const memoryStorage = (slugs: string[] = [], owner: string | null = null): CartStorage => {
  let current = [...slugs]
  let currentOwner = owner
  return {
    read: () => [...current],
    write: (next) => {
      current = [...new Set(next)]
    },
    clear: () => {
      current = []
      currentOwner = null
    },
    readOwner: () => currentOwner,
    writeOwner: (next) => {
      currentOwner = next
    },
  }
}

const fakeServer = ({ customerId, cart = [], owned = [] }: { customerId: string | null; cart?: string[]; owned?: string[] }) => {
  const carts = new Map<string, string[]>()
  if (customerId) carts.set(customerId, [...cart])
  const log: string[] = []
  let gate: Promise<void> | null = null
  const server: CartServer = {
    currentCustomerId: async () => customerId,
    readCart: async (id) => {
      log.push('read')
      if (gate) await gate
      return [...(carts.get(id) ?? [])]
    },
    writeCart: async (id, slugs) => {
      log.push(`write ${slugs.join(',') || '(empty)'}`)
      carts.set(id, [...slugs])
    },
    ownedSlugs: async () => [...owned],
  }
  // Holds every readCart until the returned function is called, so a test can
  // act while a merge is "in flight" to the server.
  const holdReads = () => {
    let release: () => void = () => undefined
    gate = new Promise<void>((resolve) => {
      release = resolve
    })
    return () => {
      gate = null
      release()
    }
  }
  return { server, carts, log, holdReads }
}

const MATHS = 'grade-4-mathematics-term-3'
const HISTORY = 'grade-4-history-term-3'
const ENGLISH = 'grade-4-english-term-3'
const BUNDLE = 'grade-4-term-3-summary-bundle'

// --- The regression: clearing on the PayFast return page ------------------

test('a clear issued while the sign-in merge is still reading the account wins over the stale read', async () => {
  // Return page load: the auth provider starts merging the account cart the
  // moment the session loads, and the page's effect clears the cart a beat
  // later — before the merge has heard back from the server.
  const storage = memoryStorage([MATHS, HISTORY], 'cust-1')
  const { server, carts, holdReads } = fakeServer({ customerId: 'cust-1', cart: [MATHS, HISTORY] })
  const cart = createCartSync({ storage, server })

  const release = holdReads()
  const merging = cart.merge('cust-1')
  cart.clear()
  assert.deepEqual(storage.read(), [], 'the browser copy empties immediately')
  release()

  assert.deepEqual(await merging, [])
  await cart.settled()
  assert.deepEqual(storage.read(), [], 'the merge must not write the pre-payment cart back')
  assert.deepEqual(carts.get('cust-1'), [], 'and the account copy ends up empty too')
})

test('items the customer already owns are swept out of both copies on merge', async () => {
  // The ITN landed and the database trigger emptied the account cart, but this
  // browser (or another device) still holds the pre-payment copy.
  const storage = memoryStorage([MATHS, HISTORY, ENGLISH], 'cust-1')
  const { server, carts } = fakeServer({ customerId: 'cust-1', cart: [ENGLISH], owned: [MATHS, HISTORY] })
  const cart = createCartSync({ storage, server })

  assert.deepEqual(await cart.merge('cust-1'), [ENGLISH])
  assert.deepEqual(storage.read(), [ENGLISH])
  assert.deepEqual(carts.get('cust-1'), [ENGLISH])
})

// --- Edits during a merge are kept, not just clears -----------------------

test('an add made while the merge is in flight is kept alongside the account items', async () => {
  const storage = memoryStorage()
  const { server, carts, log, holdReads } = fakeServer({ customerId: 'cust-1', cart: [MATHS] })
  const cart = createCartSync({ storage, server })

  const release = holdReads()
  const merging = cart.merge('cust-1')
  cart.add(BUNDLE)
  release()
  await merging
  await cart.settled()

  assert.deepEqual(storage.read(), [MATHS, BUNDLE])
  assert.deepEqual(carts.get('cust-1'), [MATHS, BUNDLE])
  // Server work ran in the order it was asked for: the merge's write, then the
  // add's persist — which carried the merged cart, not the pre-merge one.
  assert.deepEqual(log, ['read', `write ${MATHS},${BUNDLE}`, `write ${MATHS},${BUNDLE}`])
})

test('a remove made while the merge is in flight is not undone by the account copy', async () => {
  const storage = memoryStorage([MATHS, HISTORY], 'cust-1')
  const { server, carts, holdReads } = fakeServer({ customerId: 'cust-1', cart: [MATHS, HISTORY] })
  const cart = createCartSync({ storage, server })

  const release = holdReads()
  const merging = cart.merge('cust-1')
  cart.remove(MATHS)
  release()
  await merging
  await cart.settled()

  assert.deepEqual(storage.read(), [HISTORY])
  assert.deepEqual(carts.get('cust-1'), [HISTORY])
})

// --- Boundaries the merge already promised --------------------------------

test('a cart left behind by another account on this browser is not folded into this one', async () => {
  const storage = memoryStorage([ENGLISH], 'cust-other')
  const { server, carts } = fakeServer({ customerId: 'cust-1', cart: [MATHS] })
  const cart = createCartSync({ storage, server })

  assert.deepEqual(await cart.merge('cust-1'), [MATHS])
  assert.deepEqual(storage.read(), [MATHS])
  assert.equal(storage.readOwner(), 'cust-1')
  assert.deepEqual(carts.get('cust-1'), [MATHS])
})

test('a guest cart never reaches the server', async () => {
  const storage = memoryStorage()
  const { server, log } = fakeServer({ customerId: null })
  const cart = createCartSync({ storage, server })

  cart.add(MATHS)
  cart.set([HISTORY, HISTORY, BUNDLE])
  await cart.settled()

  assert.deepEqual(storage.read(), [HISTORY, BUNDLE])
  assert.deepEqual(log, [])
})

test('signing out wipes only the browser copy, even with a persist still queued', async () => {
  const storage = memoryStorage([MATHS, HISTORY], 'cust-1')
  const { server, carts } = fakeServer({ customerId: 'cust-1', cart: [MATHS, HISTORY] })
  const cart = createCartSync({ storage, server })

  cart.add(ENGLISH) // queued behind nothing, but still async
  cart.clearLocal() // sign-out lands before the queue drains
  await cart.settled()

  assert.deepEqual(storage.read(), [])
  assert.equal(storage.readOwner(), null)
  assert.deepEqual(carts.get('cust-1'), [MATHS, HISTORY], 'the account keeps its saved cart')
})

test('a failed merge leaves the browser copy alone and does not jam later work', async () => {
  const storage = memoryStorage([MATHS], 'cust-1')
  const { server, carts } = fakeServer({ customerId: 'cust-1', cart: [HISTORY] })
  server.readCart = async () => {
    throw new Error('offline')
  }
  const cart = createCartSync({ storage, server })

  await assert.rejects(cart.merge('cust-1'), /offline/)
  assert.deepEqual(storage.read(), [MATHS])

  cart.add(ENGLISH)
  await cart.settled()
  assert.deepEqual(carts.get('cust-1'), [MATHS, ENGLISH])
})

// --- Wiring: the page, the real store, and the database -------------------

test('the PayFast return page empties the cart and the real store reads ownership from orders', () => {
  const returnPage = read('apps/web/src/pages/checkout-return-page.tsx')
  assert.match(returnPage, /useEffect\(\(\) => \{[\s\S]*?clearCart\(\)\s*\}, \[\]\)/)

  const cartSource = read('apps/web/src/lib/cart.ts')
  assert.match(cartSource, /createCartSync\(\{ storage, server \}\)/)
  assert.match(cartSource, /\.from\('orders'\)\.select\('items'\)\.eq\('customerId', customerId\)\.in\('status', \['paid', 'fulfilled'\]\)/)
})

const functionBody = (sql: string) => sql.match(/create or replace function public\.clear_purchased_cart_items\(\)[\s\S]*?\$\$;/)?.[0] ?? ''

test('a paid order clears its lines from the account cart inside the database', () => {
  const schema = read('supabase/schema.sql')
  const patch = read('supabase/patch/2026-09-02-clear-cart-on-paid-order.sql')

  for (const sql of [schema, patch]) {
    const fn = functionBody(sql)
    assert.ok(fn, 'trigger function is defined')
    assert.match(fn, /security definer/)
    assert.match(fn, /if new\.status not in \('paid', 'fulfilled'\) then/)
    // paid -> fulfilled (or a re-save) must not fire a second time.
    assert.match(fn, /if tg_op = 'UPDATE' and old\.status in \('paid', 'fulfilled'\) then/)
    assert.match(fn, /delete from public\.cart_items ci/)
    assert.match(fn, /c\."customerId" = new\."customerId"/)
    assert.match(fn, /ci\."productId" in \(select p\.id from public\.products p where p\.slug = any \(purchased_slugs\)\)/)
    assert.match(fn, /ci\."bundleId" in \(select b\.id from public\.bundles b where b\.slug = any \(purchased_slugs\)\)/)
    assert.match(sql, /revoke execute on function public\.clear_purchased_cart_items\(\) from public, anon, authenticated;/)
    assert.match(
      sql,
      /create trigger orders_clear_purchased_cart_items\s+after insert or update of status on public\.orders\s+for each row execute procedure public\.clear_purchased_cart_items\(\);/,
    )
  }

  // The patch has been folded back into the fresh-install schema verbatim.
  assert.equal(functionBody(schema), functionBody(patch))
})
