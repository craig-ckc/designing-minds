/* -------------------------------------------------------------------------
   Browser cart store.

   The local copy of the cart: an in-memory cache in front of a key/value
   backend (localStorage in the browser). The cache is what every reader sees,
   so rendering never parses storage, a snapshot keeps the same identity until
   the contents change, and a backend that throws (Safari private mode, quota,
   blocked site data) degrades to a cart that still works for this tab.

   Pure of `window` so it can be tested with a fake backend — cart.ts supplies
   the real one.
   ------------------------------------------------------------------------- */

/** A string key/value store, as `localStorage` provides. Any method may throw. */
export interface CartBackend {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface CartChange {
  /** The cart after the change. */
  slugs: readonly string[]
  added: readonly string[]
  removed: readonly string[]
  /** False when the browser refused the write: the change holds for this tab only. */
  persisted: boolean
}

export type CartChangeListener = (change: CartChange) => void

const parseSlugs = (raw: string | null): string[] => {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? [...new Set(parsed.filter((value): value is string => typeof value === 'string'))] : []
  } catch {
    return []
  }
}

const sameSlugs = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((slug, index) => slug === b[index])

/** An immutable view; the same array is returned until the cart changes. */
const frozen = (slugs: string[]): string[] => Object.freeze(slugs) as string[]

export function createCartStore({ backend, cartKey, ownerKey }: { backend: CartBackend | null; cartKey: string; ownerKey: string }) {
  let cache: string[] | null = null
  let owner: string | null | undefined
  let persisted = true
  // Drives both useSyncExternalStore subscribers and `onChange` listeners.
  const subscribers = new Set<() => void>()
  const changeListeners = new Set<CartChangeListener>()

  const guarded = <T>(action: () => T, fallback: T): T => {
    try {
      return action()
    } catch {
      return fallback
    }
  }

  /** Read the cart, parsing storage only on the first call. */
  const read = (): string[] => {
    if (cache === null) cache = frozen(backend ? parseSlugs(guarded(() => backend.getItem(cartKey), null)) : [])
    return cache
  }

  const notify = (change: CartChange) => {
    for (const subscriber of [...subscribers]) subscriber()
    for (const listener of [...changeListeners]) listener(change)
  }

  const commit = (next: string[], write: () => void) => {
    const previous = read()
    const slugs = frozen([...new Set(next)])
    if (sameSlugs(previous, slugs)) {
      // Nothing visible changed, but still make the best effort to persist it.
      persisted = guarded(() => { write(); return true }, false)
      return
    }
    cache = slugs
    persisted = guarded(() => { write(); return true }, false)
    notify({
      slugs,
      added: slugs.filter((slug) => !previous.includes(slug)),
      removed: previous.filter((slug) => !slugs.includes(slug)),
      persisted,
    })
  }

  return {
    read,
    has: (slug: string) => read().includes(slug),
    write: (slugs: readonly string[]) =>
      commit([...slugs], () => backend?.setItem(cartKey, JSON.stringify([...new Set(slugs)]))),
    /** Forget the cart and its owner (sign-out). */
    clear: () => {
      owner = null
      commit([], () => {
        backend?.removeItem(cartKey)
        backend?.removeItem(ownerKey)
      })
    },
    readOwner: (): string | null => {
      if (owner === undefined) owner = backend ? guarded(() => backend.getItem(ownerKey), null) : null
      return owner
    },
    writeOwner: (next: string | null) => {
      owner = next
      guarded(() => (next ? backend?.setItem(ownerKey, next) : backend?.removeItem(ownerKey)), undefined)
    },
    /** Whether the last write reached the browser's storage. */
    isPersisted: () => persisted,
    /** Another tab changed storage: drop the cache and tell subscribers if the contents differ. */
    refresh: () => {
      const previous = read()
      cache = null
      owner = undefined
      const slugs = read()
      if (sameSlugs(previous, slugs)) {
        cache = previous
        return
      }
      notify({
        slugs,
        added: slugs.filter((slug) => !previous.includes(slug)),
        removed: previous.filter((slug) => !slugs.includes(slug)),
        persisted,
      })
    },
    /** For useSyncExternalStore: re-render when the cart changes. */
    subscribe: (callback: () => void) => {
      subscribers.add(callback)
      return () => { subscribers.delete(callback) }
    },
    /** Be told what changed — for announcements. Returns an unsubscribe. */
    onChange: (listener: CartChangeListener) => {
      changeListeners.add(listener)
      return () => { changeListeners.delete(listener) }
    },
  }
}

export type CartStore = ReturnType<typeof createCartStore>
