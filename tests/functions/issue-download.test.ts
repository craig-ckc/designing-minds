import { beforeEach, describe, expect, it, vi } from 'vitest'

/* Handler-level tests for the paid-file gate. Supabase, auth and storage are
   faked at the module boundary so the tests assert on WHO may be handed a
   signed URL and for WHICH file — nothing touches a network. */

interface Row { [key: string]: unknown }
const db = vi.hoisted(() => ({
  orders: [] as Row[],
  products: [] as Row[],
  bundles: [] as Row[],
  slug_redirects: [] as Row[],
  redirectError: false,
  selects: [] as { table: string; columns: string }[],
}))
const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  signedUrl: vi.fn(),
  log: vi.fn(),
}))

vi.mock('../../apps/functions/src/lib/diagnostics.ts', () => ({ logEvent: mocks.log }))
vi.mock('../../apps/functions/src/lib/auth.ts', () => ({ requireUser: mocks.requireUser }))
vi.mock('../../apps/functions/src/lib/storage.ts', () => ({
  createSupabaseStorageProvider: () => ({ getSignedDownloadUrl: mocks.signedUrl }),
}))
vi.mock('../../apps/functions/src/lib/supabase.ts', () => ({
  createServiceClient: () => ({
    from(table: 'orders' | 'products' | 'bundles' | 'slug_redirects') {
      let rows = db[table]
      const builder = {
        select(columns: string) {
          db.selects.push({ table, columns })
          return builder
        },
        eq(column: string, value: unknown) {
          rows = rows.filter((row) => row[column] === value)
          return builder
        },
        in(column: string, values: unknown[]) {
          rows = rows.filter((row) => values.includes(row[column]))
          return builder
        },
        maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
        then: (resolve: (value: { data: Row[] | null; error: { message: string } | null }) => unknown) =>
          resolve(table === 'slug_redirects' && db.redirectError ? { data: null, error: { message: 'permission denied for table slug_redirects' } } : { data: rows, error: null }),
      }
      return builder
    },
  }),
}))

const { issueDownload } = await import('../../apps/functions/src/handlers/issue-download.ts')
const { orderFiles } = await import('../../apps/functions/src/handlers/order-files.ts')

const ORDER = 'order-1'
const file = (id: string, extra: Row = {}) => ({ id, label: id, filename: `${id}.pdf`, storageKey: `products/${id}/${id}.pdf`, ...extra })
const call = (body: unknown, headers: Record<string, string> = { authorization: 'Bearer t' }) =>
  issueDownload({ method: 'POST', headers, body })

beforeEach(() => {
  vi.clearAllMocks()
  db.selects.length = 0
  db.orders = [{ id: ORDER, customerId: 'alice', status: 'paid', placedAt: '2026-10-01T10:00:00.000Z', items: [{ productSlug: 'single' }] }]
  db.products = [{ id: 'p-single', slug: 'single', title: 'Single', purchasedFiles: [file('f-single')], live: null }]
  db.bundles = []
  db.slug_redirects = []
  db.redirectError = false
  mocks.requireUser.mockResolvedValue({ id: 'alice' })
  mocks.signedUrl.mockResolvedValue('https://storage.test/signed')
})

describe('POST /api/issue-download', () => {
  it('rejects a missing or malformed body before any lookup', async () => {
    expect((await issueDownload({ method: 'POST', headers: {}, body: { orderId: ORDER } })).status).toBe(400)
    expect((await issueDownload({ method: 'GET', headers: {}, body: undefined })).status).toBe(400)
    expect(mocks.requireUser).not.toHaveBeenCalled()
  })

  it('refuses an unauthenticated caller and mints nothing', async () => {
    mocks.requireUser.mockRejectedValue(new Error('Missing bearer token.'))
    const response = await call({ orderId: ORDER, fileId: 'f-single' }, {})
    expect(response.status).toBe(401)
    expect(mocks.signedUrl).not.toHaveBeenCalled()
  })

  it('treats an order that belongs to someone else exactly like a missing one', async () => {
    mocks.requireUser.mockResolvedValue({ id: 'mallory' })
    const notYours = await call({ orderId: ORDER, fileId: 'f-single' })
    const missing = await call({ orderId: 'nope', fileId: 'f-single' })
    expect(notYours.status).toBe(401)
    expect(missing).toEqual(notYours)
    expect(mocks.signedUrl).not.toHaveBeenCalled()
  })

  it.each(['pending', 'failed', 'refunded'])('refuses a %s order', async (status) => {
    db.orders[0].status = status
    expect((await call({ orderId: ORDER, fileId: 'f-single' })).status).toBe(401)
    expect(mocks.signedUrl).not.toHaveBeenCalled()
  })

  it.each(['paid', 'fulfilled', 'payment_review'])('serves a file from a %s order and passes the signed-URL expiry through', async (status) => {
    db.orders[0].status = status
    const response = await call({ orderId: ORDER, fileId: 'f-single' })
    expect(response).toEqual({ status: 200, body: { url: 'https://storage.test/signed', expiresInSeconds: 300, filename: 'f-single.pdf' } })
    expect(mocks.signedUrl).toHaveBeenCalledWith('products/f-single/f-single.pdf', 300, 'f-single.pdf')
  })

  it('serves the published (live) file, not an unpublished replacement in the working copy', async () => {
    db.products = [{ slug: 'single', purchasedFiles: [file('f-draft')], live: { purchasedFiles: [file('f-live')] } }]
    expect((await call({ orderId: ORDER, fileId: 'f-draft' })).status).toBe(401)
    expect((await call({ orderId: ORDER, fileId: 'f-live' })).status).toBe(200)
  })

  it('unlocks a resource that is only reachable through a purchased bundle', async () => {
    db.orders[0].items = [{ productSlug: 'bundle-a' }]
    db.products = []
    db.bundles = [
      { id: 'b1', slug: 'bundle-a', bundle_products: [{ products: { slug: 'member-1', purchasedFiles: [file('f-member')], live: null } }, { products: null }] },
    ]
    const response = await call({ orderId: ORDER, fileId: 'f-member' })
    expect(response.status).toBe(200)
    expect(mocks.signedUrl).toHaveBeenCalledWith('products/f-member/f-member.pdf', 300, 'f-member.pdf')
  })

  it('does not unlock a file of a product that is neither bought nor in a bought bundle', async () => {
    db.products = [
      { slug: 'single', purchasedFiles: [file('f-single')], live: null },
      { slug: 'other', purchasedFiles: [file('f-other')], live: null },
    ]
    expect((await call({ orderId: ORDER, fileId: 'f-other' })).status).toBe(401)
    expect(mocks.signedUrl).not.toHaveBeenCalled()
  })

  it('answers an unknown file id with the same refusal', async () => {
    const response = await call({ orderId: ORDER, fileId: 'does-not-exist' })
    expect(response.status).toBe(401)
    expect(mocks.signedUrl).not.toHaveBeenCalled()
  })

  it('hides storage failures behind a generic 500', async () => {
    mocks.signedUrl.mockRejectedValue(new Error('bucket exploded: secret detail'))
    const response = await call({ orderId: ORDER, fileId: 'f-single' })
    expect(response.status).toBe(500)
    expect(JSON.stringify(response.body)).not.toContain('secret detail')
  })

  it('fails closed when a file has no storage key', async () => {
    db.products = [{ slug: 'single', purchasedFiles: [{ id: 'f-single', label: 'x', filename: 'x.pdf' }], live: null }]
    expect((await call({ orderId: ORDER, fileId: 'f-single' })).status).toBe(500)
    expect(mocks.signedUrl).not.toHaveBeenCalled()
  })

  it('reads only the product columns it needs (BS-12)', async () => {
    await call({ orderId: ORDER, fileId: 'f-single' })
    const productSelect = db.selects.find((entry) => entry.table === 'products')
    const bundleSelect = db.selects.find((entry) => entry.table === 'bundles')
    expect(productSelect?.columns).not.toContain('*')
    expect(productSelect?.columns).toBe('id,slug,title,purchasedFiles,live')
    expect(bundleSelect?.columns).not.toContain('*')
  })
})

describe('download entitlement survives slug changes (order lines keyed by slug before 2026-11-12)', () => {
  it('follows a rename made after the purchase through the slug history', async () => {
    db.products = [{ id: 'p-single', slug: 'renamed', title: 'Single', purchasedFiles: [file('f-single')], live: null }]
    db.slug_redirects = [{ entityType: 'product', entityId: 'p-single', fromPath: '/shop/single', createdAt: '2026-11-01T00:00:00.000Z' }]
    expect((await call({ orderId: ORDER, fileId: 'f-single' })).status).toBe(200)
  })

  it('keeps the buyer on the renamed resource when another product later reuses the old slug', async () => {
    db.products = [
      { id: 'p-single', slug: 'renamed', title: 'Single', purchasedFiles: [file('f-single')], live: null },
      { id: 'p-new', slug: 'single', title: 'Newcomer', purchasedFiles: [file('f-new')], live: null },
    ]
    db.slug_redirects = [{ entityType: 'product', entityId: 'p-single', fromPath: '/shop/single', createdAt: '2026-11-01T00:00:00.000Z' }]
    expect((await call({ orderId: ORDER, fileId: 'f-single' })).status).toBe(200)
    expect((await call({ orderId: ORDER, fileId: 'f-new' })).status).toBe(401)
  })

  it('uses the current holder of the slug for an order placed after an older rename', async () => {
    db.orders[0].placedAt = '2026-11-05T00:00:00.000Z'
    db.products = [
      { id: 'p-old', slug: 'retired', title: 'Old', purchasedFiles: [file('f-old')], live: null },
      { id: 'p-single', slug: 'single', title: 'Single', purchasedFiles: [file('f-single')], live: null },
    ]
    db.slug_redirects = [{ entityType: 'product', entityId: 'p-old', fromPath: '/shop/single', createdAt: '2026-11-01T00:00:00.000Z' }]
    expect((await call({ orderId: ORDER, fileId: 'f-single' })).status).toBe(200)
    expect((await call({ orderId: ORDER, fileId: 'f-old' })).status).toBe(401)
  })

  it('resolves a renamed bundle through the slug history', async () => {
    db.orders[0].items = [{ productSlug: 'old-bundle' }]
    db.products = []
    db.bundles = [{ id: 'b1', slug: 'new-bundle', bundle_products: [{ products: { id: 'm1', slug: 'member-1', purchasedFiles: [file('f-member')], live: null } }] }]
    db.slug_redirects = [{ entityType: 'bundle', entityId: 'b1', fromPath: '/shop/old-bundle', createdAt: '2026-11-01T00:00:00.000Z' }]
    expect((await call({ orderId: ORDER, fileId: 'f-member' })).status).toBe(200)
  })

  it('prefers the product id recorded on newer order lines over any slug', async () => {
    db.orders[0].items = [{ productSlug: 'single', productId: 'p-bought' }]
    db.products = [
      { id: 'p-bought', slug: 'something-else', title: 'Bought', purchasedFiles: [file('f-bought')], live: null },
      { id: 'p-single', slug: 'single', title: 'Single', purchasedFiles: [file('f-single')], live: null },
    ]
    expect((await call({ orderId: ORDER, fileId: 'f-bought' })).status).toBe(200)
    expect((await call({ orderId: ORDER, fileId: 'f-single' })).status).toBe(401)
  })

  it('ignores physical lines, which never grant files', async () => {
    db.orders[0].items = [{ productSlug: 'single', productType: 'physical', productKind: 'Physical' }]
    expect((await call({ orderId: ORDER, fileId: 'f-single' })).status).toBe(401)
  })
})

describe('slug history is optional', () => {
  it('falls back to matching by slug when the history cannot be read', async () => {
    db.redirectError = true
    expect((await call({ orderId: ORDER, fileId: 'f-single' })).status).toBe(200)
  })
})

describe('POST /api/order-files', () => {
  const list = (body: unknown, headers: Record<string, string> = { authorization: 'Bearer t' }) => orderFiles({ method: 'POST', headers, body })

  it('lists each line’s files by position, with live labels and no storage keys', async () => {
    db.orders[0].items = [{ productSlug: 'single' }, { productSlug: 'keyring', productType: 'physical' }, { productSlug: 'bundle-a' }]
    db.products = [{ id: 'p-single', slug: 'single', title: 'Draft title', purchasedFiles: [file('f-draft')], live: { title: 'Single', purchasedFiles: [file('f-single')] } }]
    db.bundles = [{ id: 'b1', slug: 'bundle-a', bundle_products: [{ products: { id: 'm1', slug: 'member-1', title: 'Member', purchasedFiles: [file('f-member')], live: null } }] }]
    const response = await list({ orderId: ORDER })
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ lines: [
      { index: 0, files: [{ id: 'f-single', label: 'f-single', productTitle: 'Single' }] },
      { index: 2, files: [{ id: 'f-member', label: 'f-member', productTitle: 'Member' }] },
    ] })
    expect(JSON.stringify(response.body)).not.toContain('storage')
  })

  it('still lists an archived (no live copy) or renamed resource', async () => {
    db.products = [{ id: 'p-single', slug: 'renamed', title: 'Single', purchasedFiles: [file('f-single')], live: null }]
    db.slug_redirects = [{ entityType: 'product', entityId: 'p-single', fromPath: '/shop/single', createdAt: '2026-11-01T00:00:00.000Z' }]
    const response = await list({ orderId: ORDER })
    expect(response.body).toEqual({ lines: [{ index: 0, files: [{ id: 'f-single', label: 'f-single', productTitle: 'Single' }] }] })
  })

  it('refuses unpaid, foreign, unauthenticated and malformed requests', async () => {
    expect((await list({})).status).toBe(400)
    expect((await orderFiles({ method: 'GET', headers: {}, body: undefined })).status).toBe(400)
    mocks.requireUser.mockRejectedValueOnce(new Error('Missing bearer token.'))
    expect((await list({ orderId: ORDER }, {})).status).toBe(401)
    db.orders[0].status = 'pending'
    expect((await list({ orderId: ORDER })).status).toBe(401)
    db.orders[0].status = 'paid'
    mocks.requireUser.mockResolvedValue({ id: 'mallory' })
    expect((await list({ orderId: ORDER })).status).toBe(401)
  })
})
