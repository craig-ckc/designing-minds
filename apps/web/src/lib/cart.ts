import { supabase } from './supabase'

const CART_KEY = 'designing-minds.cart.v1'
const CART_EVENT = 'designing-minds:cart'

const read = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}

const writeLocal = (slugs: string[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_KEY, JSON.stringify([...new Set(slugs)]))
  window.dispatchEvent(new Event(CART_EVENT))
}

const productIdsForSlugs = async (slugs: string[]) => {
  if (!supabase || slugs.length === 0) return []
  const { data, error } = await supabase.from('catalog_products').select('id,slug').in('slug', slugs)
  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; slug: string }[]
}

const ensureCart = async (customerId: string) => {
  if (!supabase) return null
  const { data, error } = await supabase.from('carts').upsert({ customerId }, { onConflict: 'customerId' }).select('id').single()
  if (error) throw new Error(error.message)
  return data as { id: string }
}

const persistSignedInCart = async (slugs: string[]) => {
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  const customerId = data.session?.user.id
  if (!customerId) return

  const cart = await ensureCart(customerId)
  if (!cart) return

  const products = await productIdsForSlugs([...new Set(slugs)])
  const { error: deleteError } = await supabase.from('cart_items').delete().eq('cartId', cart.id)
  if (deleteError) throw new Error(deleteError.message)
  if (products.length === 0) return

  const { error: insertError } = await supabase.from('cart_items').insert(products.map((product) => ({ cartId: cart.id, productId: product.id })))
  if (insertError) throw new Error(insertError.message)
}

const write = (slugs: string[]) => {
  const unique = [...new Set(slugs)]
  writeLocal(unique)
  void persistSignedInCart(unique).catch(() => undefined)
}

const readSignedInCart = async (customerId: string) => {
  if (!supabase) return []
  const cart = await ensureCart(customerId)
  if (!cart) return []

  const { data: items, error: itemsError } = await supabase.from('cart_items').select('productId').eq('cartId', cart.id)
  if (itemsError) throw new Error(itemsError.message)
  const productIds = [...new Set(((items ?? []) as { productId: string }[]).map((item) => item.productId))]
  if (productIds.length === 0) return []

  const { data: products, error: productsError } = await supabase.from('catalog_products').select('slug').in('id', productIds)
  if (productsError) throw new Error(productsError.message)
  return ((products ?? []) as { slug: string }[]).map((product) => product.slug)
}

export const getCartSlugs = read
export const setCartSlugs = write
export const addCartSlug = (slug: string) => write([...read(), slug])
export const removeCartSlug = (slug: string) => write(read().filter((entry) => entry !== slug))
export const clearCart = () => write([])
export const CART_CHANGED_EVENT = CART_EVENT

export const mergeSignedInCart = async (customerId: string) => {
  const merged = [...new Set([...(await readSignedInCart(customerId)), ...read()])]
  writeLocal(merged)
  await persistSignedInCart(merged)
  return merged
}
