import { supabase } from './supabase'
import { createCartSync, type CartServer, type CartStorage } from './cart-sync'

const CART_KEY = 'designing-minds.cart.v1'
// Tracks which signed-in user the local cart currently belongs to (absent = guest).
// Lets us avoid folding one account's leftover cart into another on a shared browser.
const CART_OWNER_KEY = 'designing-minds.cart.owner.v1'
const CART_EVENT = 'designing-minds:cart'

const hasWindow = () => typeof window !== 'undefined'
const announce = () => window.dispatchEvent(new Event(CART_EVENT))

const storage: CartStorage = {
  read: () => {
    if (!hasWindow()) return []
    try {
      const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) ?? '[]')
      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
    } catch {
      return []
    }
  },
  write: (slugs) => {
    if (!hasWindow()) return
    window.localStorage.setItem(CART_KEY, JSON.stringify([...new Set(slugs)]))
    announce()
  },
  clear: () => {
    if (!hasWindow()) return
    window.localStorage.removeItem(CART_KEY)
    window.localStorage.removeItem(CART_OWNER_KEY)
    announce()
  },
  readOwner: () => (hasWindow() ? window.localStorage.getItem(CART_OWNER_KEY) : null),
  writeOwner: (owner) => {
    if (!hasWindow()) return
    if (owner) window.localStorage.setItem(CART_OWNER_KEY, owner)
    else window.localStorage.removeItem(CART_OWNER_KEY)
  },
}

// A cart line names either a resource or a bundle. The two Collections share
// the /shop/<slug> space, so a slug is resolved against both public views.
type CatalogView = 'catalog_products' | 'catalog_bundles'
interface CatalogRef {
  id: string
  slug: string
}
interface CartLine {
  productId: string | null
  bundleId: string | null
}

const nonNull = <T>(value: T | null): value is T => value !== null

const lookup = async (view: CatalogView, column: 'id' | 'slug', values: string[]): Promise<CatalogRef[]> => {
  if (!supabase || values.length === 0) return []
  const { data, error } = await supabase.from(view).select('id,slug').in(column, values)
  if (error) throw new Error(error.message)
  return (data ?? []) as CatalogRef[]
}

const ensureCart = async (customerId: string) => {
  if (!supabase) return null
  const { data, error } = await supabase.from('carts').upsert({ customerId }, { onConflict: 'customerId' }).select('id').single()
  if (error) throw new Error(error.message)
  return data as { id: string }
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
    const lines = (data ?? []) as CartLine[]
    const [products, bundles] = await Promise.all([
      lookup('catalog_products', 'id', [...new Set(lines.map((line) => line.productId).filter(nonNull))]),
      lookup('catalog_bundles', 'id', [...new Set(lines.map((line) => line.bundleId).filter(nonNull))]),
    ])
    return [...products, ...bundles].map((ref) => ref.slug)
  },

  writeCart: async (customerId, slugs) => {
    if (!supabase) return
    const cart = await ensureCart(customerId)
    if (!cart) return
    const [products, bundles] = await Promise.all([lookup('catalog_products', 'slug', slugs), lookup('catalog_bundles', 'slug', slugs)])
    const { error: deleteError } = await supabase.from('cart_items').delete().eq('cartId', cart.id)
    if (deleteError) throw new Error(deleteError.message)
    const rows = [
      ...products.map((product) => ({ cartId: cart.id, productId: product.id })),
      ...bundles.map((bundle) => ({ cartId: cart.id, bundleId: bundle.id })),
    ]
    if (rows.length === 0) return
    const { error: insertError } = await supabase.from('cart_items').insert(rows)
    if (insertError) throw new Error(insertError.message)
  },

  // Order lines are a JSONB snapshot taken at purchase, so the slug is read
  // off each line rather than joined to the catalogue.
  ownedSlugs: async (customerId) => {
    if (!supabase) return []
    const { data, error } = await supabase.from('orders').select('items').eq('customerId', customerId).in('status', ['paid', 'fulfilled'])
    if (error) throw new Error(error.message)
    return ((data ?? []) as { items: unknown }[]).flatMap((order) =>
      Array.isArray(order.items)
        ? order.items
            .map((item) => (typeof item === 'object' && item ? (item as { productSlug?: unknown }).productSlug : null))
            .filter((slug): slug is string => typeof slug === 'string')
        : [],
    )
  },
}

const cart = createCartSync({ storage, server })

export const getCartSlugs = cart.read
export const setCartSlugs = cart.set
export const addCartSlug = cart.add
export const removeCartSlug = cart.remove
/** Empty the cart everywhere: this browser now, the account as soon as the queue reaches it. */
export const clearCart = cart.clear
/** Wipe only the browser copy — sign-out, where the account's saved cart must survive. */
export const clearLocalCart = cart.clearLocal
export const mergeSignedInCart = cart.merge
export const CART_CHANGED_EVENT = CART_EVENT
