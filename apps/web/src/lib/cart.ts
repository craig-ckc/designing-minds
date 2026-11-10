import { supabase } from './supabase'
import { createCartSync, type CartServer, type CartStorage } from './cart-sync'
import { createCartStore, type CartBackend } from './cart-store'
import { planCartWrite, type CartRow, type CatalogRef } from './cart-rows'

const previewSuffix = import.meta.env.DEV && import.meta.env.VITE_LOCAL_COMMERCE_PREVIEW === 'true' ? '.preview' : ''
const CART_KEY = `designing-minds.cart.v1${previewSuffix}`
// Tracks which signed-in user the local cart currently belongs to (absent = guest).
// Lets us avoid folding one account's leftover cart into another on a shared browser.
const CART_OWNER_KEY = `designing-minds.cart.owner.v1${previewSuffix}`

/** `window.localStorage` itself can throw on access (blocked site data), so reach for it defensively. */
const browserBackend = (): CartBackend | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** The browser cart: cached reads, guarded writes with an in-memory fallback. */
const store = createCartStore({ backend: browserBackend(), cartKey: CART_KEY, ownerKey: CART_OWNER_KEY })

// Another tab edited the cart: drop our cache and tell subscribers.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === CART_KEY || event.key === CART_OWNER_KEY) store.refresh()
  })
}

const storage: CartStorage = {
  read: store.read,
  write: store.write,
  clear: store.clear,
  readOwner: store.readOwner,
  writeOwner: store.writeOwner,
}

// A cart line names either a resource or a bundle. The two Collections share
// the /shop/<slug> space, so a slug is resolved against both public views.
type CatalogView = 'catalog_products' | 'catalog_bundles'
type CartLine = Pick<CartRow, 'productId' | 'bundleId'>

const nonNull = <T>(value: T | null): value is T => value !== null

const lookup = async (view: CatalogView, column: 'id' | 'slug', values: readonly string[]): Promise<CatalogRef[]> => {
  if (!supabase || values.length === 0) return []
  const { data, error } = await supabase.from(view).select('id,slug').in(column, [...values])
  if (error) throw new Error(error.message)
  return data ?? []
}

const readRows = async (cartId: string): Promise<CartRow[]> => {
  if (!supabase) return []
  const { data, error } = await supabase.from('cart_items').select('id,productId,bundleId').eq('cartId', cartId)
  if (error) throw new Error(error.message)
  return data ?? []
}

const ensureCart = async (customerId: string) => {
  if (!supabase) return null
  const { data, error } = await supabase.from('carts').upsert({ customerId }, { onConflict: 'customerId' }).select('id').single()
  if (error) throw new Error(error.message)
  const cart: { id: string } = data
  return cart
}

const server: CartServer = {
  currentCustomerId: async () => {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    return data.session?.user.id ?? null
  },

  readCart: async (customerId) => {
    if (!supabase) return []
    const cart = await ensureCart(customerId)
    if (!cart) return []
    const { data, error } = await supabase.from('cart_items').select('productId,bundleId').eq('cartId', cart.id)
    if (error) throw new Error(error.message)
    const lines: CartLine[] = data ?? []
    const [products, bundles] = await Promise.all([
      lookup('catalog_products', 'id', [...new Set(lines.map((line) => line.productId).filter(nonNull))]),
      lookup('catalog_bundles', 'id', [...new Set(lines.map((line) => line.bundleId).filter(nonNull))]),
    ])
    return [...products, ...bundles].map((ref) => ref.slug)
  },

  // Reconcile rather than replace: insert what is missing, then delete only what
  // was removed, so a failure part-way never leaves the account with an empty cart.
  writeCart: async (customerId, slugs) => {
    if (!supabase) return
    const cart = await ensureCart(customerId)
    if (!cart) return
    const [products, bundles, existing] = await Promise.all([
      lookup('catalog_products', 'slug', slugs),
      lookup('catalog_bundles', 'slug', slugs),
      readRows(cart.id),
    ])
    const { insert, deleteIds } = planCartWrite({ existing, products, bundles })
    if (insert.length > 0) {
      const { error } = await supabase.from('cart_items').insert(insert.map((row) => ({ cartId: cart.id, ...row })))
      if (error) throw new Error(error.message)
    }
    if (deleteIds.length > 0) {
      const { error } = await supabase.from('cart_items').delete().eq('cartId', cart.id).in('id', deleteIds)
      if (error) throw new Error(error.message)
    }
  },

  // Order lines are a JSONB snapshot taken at purchase, so the slug is read
  // off each line rather than joined to the catalogue.
  ownedSlugs: async (customerId) => {
    if (!supabase) return []
    const { data, error } = await supabase.from('orders').select('items').eq('customerId', customerId).in('status', ['paid', 'fulfilled'])
    if (error) throw new Error(error.message)
    const orders: { items: unknown }[] = data ?? []
    return orders.flatMap((order) =>
      Array.isArray(order.items)
        ? order.items
            .filter((item) => !(item && typeof item === 'object' && (item as { productType?: unknown }).productType === 'physical'))
            .map((item) => (typeof item === 'object' && item ? (item as { productSlug?: unknown }).productSlug : null))
            .filter((slug): slug is string => typeof slug === 'string')
        : [],
    )
  },
}

const cart = createCartSync({ storage, server })

export const getCartSlugs = store.read
export const setCartSlugs = cart.set
export const addCartSlug = cart.add
export const removeCartSlug = cart.remove
/** Empty the cart everywhere: this browser now, the account as soon as the queue reaches it. */
export const clearCart = cart.clear
/** Wipe only the browser copy — sign-out, where the account's saved cart must survive. */
export const clearLocalCart = cart.clearLocal
export const prepareCustomerCart = cart.prepareCustomer
export const mergeSignedInCart = cart.merge

/** The cart's current slugs. Cached: the same array until the cart changes. Do not mutate. */
export const readCartSlugs = store.read
export const cartHas = store.has
/** Subscribe for useSyncExternalStore: `callback` runs after every cart change. */
export const subscribeCart = store.subscribe
/** Whether the last write reached this browser's storage (false = the cart lives in memory for this tab only). */
export const isCartPersisted = store.isPersisted
/**
 * Be told what changed in the cart — from this tab or another — e.g. to announce
 * "Added to cart". Returns an unsubscribe function.
 */
export const onCartChange = store.onChange

// Shared import surface for the structured physical cart.
export { addPhysicalCartLine } from './physical-cart'
