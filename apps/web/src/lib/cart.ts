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

const write = (slugs: string[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_KEY, JSON.stringify([...new Set(slugs)]))
  window.dispatchEvent(new Event(CART_EVENT))
}

export const getCartSlugs = read
export const setCartSlugs = write
export const addCartSlug = (slug: string) => write([...read(), slug])
export const removeCartSlug = (slug: string) => write(read().filter((entry) => entry !== slug))
export const clearCart = () => write([])
export const CART_CHANGED_EVENT = CART_EVENT

