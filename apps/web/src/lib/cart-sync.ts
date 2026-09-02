/**
 * Cart synchronisation engine.
 *
 * A cart lives in two places: this browser (localStorage) and, once the
 * shopper signs in, their account (the carts / cart_items tables). Local edits
 * apply immediately and are pushed to the account afterwards; a sign-in merge
 * folds the two copies together.
 *
 * Two rules keep the copies honest:
 *
 *   1. Server work runs one operation at a time, in the order it was asked
 *      for, so a persist queued behind a merge can never be overtaken by it.
 *   2. Edits made while a merge is pending are replayed over what it read
 *      from the server. Without this, a clear issued on the PayFast return
 *      page lost to the merge the auth provider had already started, which
 *      wrote the pre-payment cart straight back — locally and to the account.
 *
 * Items the customer already owns are dropped on every merge: a paid order
 * clears them from the account cart server-side, and this sweeps them out of
 * any browser that still holds the pre-payment copy.
 *
 * Pure so it can be tested without a browser or Supabase — cart.ts supplies
 * the real storage and server.
 */

export interface CartStorage {
  read(): string[]
  write(slugs: string[]): void
  /** Forget the cart and its owner without touching the server (sign-out). */
  clear(): void
  /** Which signed-in user the local cart belongs to; null for a guest. */
  readOwner(): string | null
  writeOwner(owner: string | null): void
}

export interface CartServer {
  /** The signed-in customer, or null for a guest. */
  currentCustomerId(): Promise<string | null>
  readCart(customerId: string): Promise<string[]>
  writeCart(customerId: string, slugs: string[]): Promise<void>
  /** Slugs in the customer's paid or fulfilled orders. */
  ownedSlugs(customerId: string): Promise<string[]>
}

type CartEdit = { kind: 'add'; slug: string } | { kind: 'remove'; slug: string } | { kind: 'clear' }

const unique = (slugs: string[]) => [...new Set(slugs)]

const applyEdits = (slugs: string[], edits: CartEdit[]) =>
  edits.reduce<string[]>((current, edit) => {
    if (edit.kind === 'clear') return []
    if (edit.kind === 'remove') return current.filter((slug) => slug !== edit.slug)
    return current.includes(edit.slug) ? current : [...current, edit.slug]
  }, slugs)

export function createCartSync({ storage, server }: { storage: CartStorage; server: CartServer }) {
  // Every server operation joins this chain, so they run strictly in order.
  let queue: Promise<unknown> = Promise.resolve()
  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task)
    queue = run.catch(() => undefined)
    return run
  }

  // Edits made while a merge is pending — from the moment it is asked for
  // until it has heard back from the server. Each merge replays the edits that
  // arrived after it was asked for, so an edit can't be lost to a stale read
  // whether it lands before the merge's turn in the queue or mid-flight.
  let pendingMerges = 0
  let editsWhilePending: CartEdit[] = []

  // Pushes the browser copy to the account it belongs to. Reads the cart when
  // it runs, not when it was queued, so it always carries the latest edits —
  // and skips when the local cart isn't this account's (a guest's, or one
  // left behind by another user) so the merge decides what to fold in.
  const persist = () =>
    enqueue(async () => {
      const customerId = await server.currentCustomerId()
      if (!customerId || storage.readOwner() !== customerId) return
      await server.writeCart(customerId, storage.read())
    })

  const commit = (edits: CartEdit[]) => {
    storage.write(applyEdits(storage.read(), edits))
    if (pendingMerges > 0) editsWhilePending.push(...edits)
    void persist().catch(() => undefined)
  }

  const merge = (customerId: string) => {
    pendingMerges += 1
    const firstEdit = editsWhilePending.length
    return enqueue(async () => {
      // Only fold the local cart into this account if it belongs to a guest
      // (no owner) or to this same user. A cart left behind by a different
      // signed-in user — switching accounts on a shared browser — must not
      // leak across accounts, even if sign-out failed to clear it.
      const owner = storage.readOwner()
      const local = owner && owner !== customerId ? [] : storage.read()

      // Whatever the server answers, this merge's recording window closes here.
      const closeWindow = () => {
        const replay = editsWhilePending.slice(firstEdit)
        pendingMerges -= 1
        if (pendingMerges === 0) editsWhilePending = []
        return replay
      }
      const [remote, owned] = await Promise.all([server.readCart(customerId), server.ownedSlugs(customerId)]).catch((error: unknown) => {
        closeWindow()
        throw error
      })
      const replay = closeWindow()

      const ownedSet = new Set(owned)
      const merged = applyEdits(unique([...remote, ...local]), replay).filter((slug) => !ownedSet.has(slug))

      storage.write(merged)
      storage.writeOwner(customerId)
      await server.writeCart(customerId, merged)
      return merged
    })
  }

  return {
    read: () => storage.read(),
    set: (slugs: string[]) => commit([{ kind: 'clear' }, ...unique(slugs).map((slug): CartEdit => ({ kind: 'add', slug }))]),
    add: (slug: string) => commit([{ kind: 'add', slug }]),
    remove: (slug: string) => commit([{ kind: 'remove', slug }]),
    clear: () => commit([{ kind: 'clear' }]),
    clearLocal: () => storage.clear(),
    merge,
    /** Resolves once every server operation queued so far has finished. */
    settled: () => queue.then(() => undefined),
  }
}
