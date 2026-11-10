import { useSyncExternalStore } from 'react'
import type { OrderItem, PhysicalCartLine } from '@designing-minds/cms'
import { physicalLineKey, quantityValidation } from '@designing-minds/cms'
import { supabase } from './supabase'

export type AddPhysicalCartLineInput = Omit<PhysicalCartLine, 'id'>

export interface PhysicalCartStorage {
  read(): readonly PhysicalCartLine[]
  write(lines: readonly PhysicalCartLine[]): void
  clear(): void
  readOwner(): string | null
  writeOwner(owner: string | null): void
}

export interface PhysicalCartServer {
  currentCustomerId(): Promise<string | null>
  readCart(customerId: string): Promise<PhysicalCartLine[]>
  writeCart(customerId: string, lines: readonly PhysicalCartLine[]): Promise<void>
}

type PhysicalCartEdit =
  | { kind: 'add'; line: PhysicalCartLine; increment: number }
  | { kind: 'remove'; id: string; key: string }
  | { kind: 'update'; id: string; key: string; quantity: number }
  | { kind: 'clear' }

const validCustomizations = (value: unknown): value is Record<string, string> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) &&
  Object.values(value).every((entry) => typeof entry === 'string')

const validLine = (value: unknown): value is PhysicalCartLine => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const line = value as Partial<PhysicalCartLine>
  return typeof line.id === 'string' && line.id.length > 0 &&
    typeof line.productSlug === 'string' && line.productSlug.length > 0 &&
    typeof line.variantId === 'string' && line.variantId.length > 0 &&
    quantityValidation(line.quantity) === null && validCustomizations(line.customizations)
}

const copyLine = (line: PhysicalCartLine): PhysicalCartLine => ({
  ...line,
  customizations: { ...line.customizations },
})

const parseLines = (raw: string | null): PhysicalCartLine[] => {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(validLine).map(copyLine)
  } catch {
    return []
  }
}

const freezeLines = (lines: readonly PhysicalCartLine[]): PhysicalCartLine[] =>
  Object.freeze(lines.map((line) => Object.freeze({ ...line, customizations: Object.freeze({ ...line.customizations }) }))) as PhysicalCartLine[]

const sameLines = (a: readonly PhysicalCartLine[], b: readonly PhysicalCartLine[]) =>
  a.length === b.length && a.every((line, index) =>
    line.id === b[index]?.id && line.productSlug === b[index]?.productSlug &&
    line.variantId === b[index]?.variantId && line.quantity === b[index]?.quantity &&
    physicalLineKey(line) === physicalLineKey(b[index]!),
  )

/** Browser-side structured-cart cache. It stays pure of `window` for tests and SSR. */
export function createPhysicalCartStore({
  backend,
  cartKey,
  ownerKey,
}: {
  backend: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null
  cartKey: string
  ownerKey: string
}) {
  let cache: PhysicalCartLine[] | null = null
  let owner: string | null | undefined
  const subscribers = new Set<() => void>()

  const guarded = <T,>(action: () => T, fallback: T): T => {
    try { return action() } catch { return fallback }
  }

  const read = (): PhysicalCartLine[] => {
    if (cache === null) cache = freezeLines(backend ? parseLines(guarded(() => backend.getItem(cartKey), null)) : [])
    return cache
  }

  const notify = () => {
    for (const subscriber of [...subscribers]) subscriber()
  }

  const write = (lines: readonly PhysicalCartLine[]) => {
    const next = freezeLines(lines)
    const changed = !sameLines(read(), next)
    cache = next
    guarded(() => backend?.setItem(cartKey, JSON.stringify(next)), undefined)
    if (changed) notify()
  }

  const clear = () => {
    const changed = read().length > 0 || readOwner() !== null
    cache = freezeLines([])
    owner = null
    guarded(() => {
      backend?.removeItem(cartKey)
      backend?.removeItem(ownerKey)
    }, undefined)
    if (changed) notify()
  }

  const readOwner = (): string | null => {
    if (owner === undefined) owner = backend ? guarded(() => backend.getItem(ownerKey), null) : null
    return owner
  }

  const writeOwner = (next: string | null) => {
    const changed = readOwner() !== next
    owner = next
    guarded(() => (next ? backend?.setItem(ownerKey, next) : backend?.removeItem(ownerKey)), undefined)
    if (changed) notify()
  }

  const refresh = () => {
    const previous = read()
    const previousOwner = readOwner()
    cache = null
    owner = undefined
    const next = read()
    if (sameLines(previous, next) && readOwner() === previousOwner) {
      cache = previous
      return
    }
    notify()
  }

  return {
    read,
    write,
    clear,
    readOwner,
    writeOwner,
    refresh,
    subscribe: (callback: () => void) => {
      subscribers.add(callback)
      return () => { subscribers.delete(callback) }
    },
  }
}

/** Merge separate guest/account copies, summing matching configurations once. */
const mergeCopies = (remote: readonly PhysicalCartLine[], local: readonly PhysicalCartLine[]) => {
  const merged: PhysicalCartLine[] = []
  const byId = new Map<string, number>()
  const byKey = new Map<string, number>()

  for (const line of [...remote, ...local]) {
    const existingIdIndex = byId.get(line.id)
    if (existingIdIndex !== undefined) {
      // The local browser copy may contain a newer edit for this same row.
      if (local.includes(line)) merged[existingIdIndex] = copyLine(line)
      continue
    }
    const key = physicalLineKey(line)
    const existingKeyIndex = byKey.get(key)
    if (existingKeyIndex !== undefined) {
      const current = merged[existingKeyIndex]!
      const quantity = current.quantity + line.quantity
      if (quantityValidation(quantity)) throw new RangeError('Combined cart quantity exceeds the allowed limit.')
      merged[existingKeyIndex] = { ...current, quantity }
      byId.set(line.id, existingKeyIndex)
      continue
    }
    byId.set(line.id, merged.length)
    byKey.set(key, merged.length)
    merged.push(copyLine(line))
  }
  return merged
}

const applyEdits = (lines: readonly PhysicalCartLine[], edits: readonly PhysicalCartEdit[]) =>
  edits.reduce<PhysicalCartLine[]>((current, edit) => {
    if (edit.kind === 'clear') return []
    if (edit.kind === 'remove') return current.filter((line) => physicalLineKey(line) !== edit.key)
    if (edit.kind === 'update') {
      const next = current.map((line) => {
        if (line.id !== edit.id && physicalLineKey(line) !== edit.key) return line
        return { ...line, quantity: edit.quantity }
      })
      return next
    }

    const byId = current.findIndex((line) => line.id === edit.line.id || physicalLineKey(line) === physicalLineKey(edit.line))
    if (byId >= 0) {
      const next = [...current]
      const quantity = next[byId]!.quantity + edit.increment
      if (quantityValidation(quantity)) throw new RangeError('Combined cart quantity exceeds the allowed limit.')
      next[byId] = { ...next[byId]!, quantity }
      return next
    }
    return [...current, copyLine(edit.line)]
  }, [...lines])

const defaultIdFactory = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

export function createPhysicalCartSync({
  storage,
  server,
  idFactory = defaultIdFactory,
}: {
  storage: PhysicalCartStorage
  server: PhysicalCartServer
  idFactory?: () => string
}) {
  let queue: Promise<unknown> = Promise.resolve()
  let generation = 0
  let pendingMerges = 0
  let editsWhilePending: PhysicalCartEdit[] = []

  const enqueue = <T,>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task)
    queue = run.catch(() => undefined)
    return run
  }

  const persist = () => {
    const writeGeneration = generation
    return enqueue(async () => {
    const customerId = await server.currentCustomerId()
    if (writeGeneration !== generation || !customerId || storage.readOwner() !== customerId) return
    await server.writeCart(customerId, storage.read())
    })
  }

  const commit = (edit: PhysicalCartEdit) => {
    storage.write(applyEdits(storage.read(), [edit]))
    if (pendingMerges > 0) editsWhilePending.push(edit)
    void persist().catch(() => undefined)
  }

  const ensureValidInput = (input: AddPhysicalCartLineInput) => {
    if (!input || typeof input.productSlug !== 'string' || !input.productSlug || typeof input.variantId !== 'string' || !input.variantId) {
      throw new TypeError('A product and variant are required.')
    }
    if (quantityValidation(input.quantity)) throw new RangeError('Quantity must be a positive whole number.')
    if (!validCustomizations(input.customizations)) throw new TypeError('Customization values must be strings.')
  }

  const add = (input: AddPhysicalCartLineInput) => {
    ensureValidInput(input)
    const key = physicalLineKey(input)
    const existing = storage.read().find((line) => physicalLineKey(line) === key)
    const line: PhysicalCartLine = existing
      ? { ...existing, quantity: existing.quantity + input.quantity }
      : { id: idFactory(), ...input, customizations: { ...input.customizations } }
    if (quantityValidation(line.quantity)) throw new RangeError('Combined cart quantity exceeds the allowed limit.')
    commit({ kind: 'add', line, increment: input.quantity })
    return copyLine(line)
  }

  const remove = (id: string) => {
    const line = storage.read().find((entry) => entry.id === id)
    if (!line) return
    commit({ kind: 'remove', id, key: physicalLineKey(line) })
  }

  const removeMany = (ids: readonly string[]) => {
    for (const id of ids) remove(id)
  }

  const update = (id: string, quantity: number) => {
    if (quantityValidation(quantity)) throw new RangeError('Quantity must be a positive whole number.')
    const line = storage.read().find((entry) => entry.id === id)
    if (!line || line.quantity === quantity) return
    commit({ kind: 'update', id, key: physicalLineKey(line), quantity })
  }

  const merge = (customerId: string) => {
    const mergeGeneration = generation
    pendingMerges += 1
    const firstEdit = editsWhilePending.length
    return enqueue(async () => {
      let closed = false
      const closeWindow = () => {
        if (closed) return []
        closed = true
        const replay = editsWhilePending.slice(firstEdit)
        pendingMerges -= 1
        if (pendingMerges === 0) editsWhilePending = []
        return replay
      }
      try {
        if (await server.currentCustomerId() !== customerId) throw new Error('Authentication changed during cart sync.')
        const owner = storage.readOwner()
        const local = owner && owner !== customerId ? [] : storage.read()
        const remote = await server.readCart(customerId)
        const replay = closeWindow()
        if (mergeGeneration !== generation) return storage.read()
        const merged = applyEdits(mergeCopies(remote, local), replay)
        storage.write(merged)
        storage.writeOwner(customerId)
        await server.writeCart(customerId, merged)
        return merged
      } catch (error) {
        closeWindow()
        throw error
      }
    })
  }

  const clearLocal = () => {
    generation += 1
    storage.clear()
  }

  return {
    read: (): PhysicalCartLine[] => storage.read() as PhysicalCartLine[],
    add,
    remove,
    removeMany,
    update,
    clear: () => commit({ kind: 'clear' }),
    clearLocal,
    prepareCustomer: (customerId: string | null) => {
      const owner = storage.readOwner()
      if (owner && owner !== customerId) clearLocal()
    },
    merge,
    settled: () => queue.then(() => undefined),
  }
}

export const isLocalCommercePreview = (): boolean =>
  import.meta.env.DEV && import.meta.env.VITE_LOCAL_COMMERCE_PREVIEW === 'true'

const localStorageBackend = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try { return window.localStorage } catch { return null }
}

const suffix = isLocalCommercePreview() ? '.preview' : ''
const CART_KEY = `designing-minds.physical-cart.v1${suffix}`
const OWNER_KEY = `designing-minds.physical-cart.owner.v1${suffix}`
const browserStorage = localStorageBackend()
const store = createPhysicalCartStore({ backend: browserStorage, cartKey: CART_KEY, ownerKey: OWNER_KEY })

const server: PhysicalCartServer = {
  currentCustomerId: async () => {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    return data.session?.user.id ?? null
  },
  readCart: async (customerId) => {
    if (!supabase) return []
    const { data, error } = await supabase.from('physical_cart_items')
      .select('id,productSlug,variantId,quantity,customizations')
      .eq('userId', customerId)
    if (error) throw new Error(error.message)
    return ((data ?? []) as unknown as PhysicalCartLine[]).filter(validLine).map(copyLine)
  },
  writeCart: async (customerId, lines) => {
    if (!supabase) return
    const { data: existingData, error: readError } = await supabase.from('physical_cart_items')
      .select('id')
      .eq('userId', customerId)
    if (readError) throw new Error(readError.message)
    const existing = (existingData ?? []) as unknown as { id: string }[]
    const rows = lines.map((line) => ({ ...line, userId: customerId }))
    if (rows.length > 0) {
      const { error } = await supabase.from('physical_cart_items').upsert(rows, { onConflict: 'id' })
      if (error) throw new Error(error.message)
    }
    const wanted = new Set(rows.map((line) => line.id))
    const deleteIds = existing.map((line) => line.id).filter((id) => !wanted.has(id))
    if (deleteIds.length > 0) {
      const { error } = await supabase.from('physical_cart_items').delete().eq('userId', customerId).in('id', deleteIds)
      if (error) throw new Error(error.message)
    }
  },
}

const cart = createPhysicalCartSync({ storage: store, server })

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === CART_KEY || event.key === OWNER_KEY) store.refresh()
  })
}

export const getPhysicalCartLines = cart.read
export const addPhysicalCartLine = cart.add
export const removePhysicalCartLine = cart.remove
export const removePhysicalCartLines = cart.removeMany
export const updatePhysicalCartLine = cart.update
/** Empty the account and browser copies. */
export const clearPhysicalCart = cart.clear
/** Forget only this browser's copy on sign-out. */
export const clearLocalPhysicalCart = cart.clearLocal
export const prepareCustomerPhysicalCart = cart.prepareCustomer
export const mergeSignedInPhysicalCart = cart.merge
export const subscribePhysicalCart = store.subscribe
export const settledPhysicalCartSync = cart.settled
const consumedOrders = new Set<string>()
/** Clear only the purchased quantities; anything added after checkout remains. */
export function consumePurchasedPhysicalCart(orderId: string, items: readonly OrderItem[]) {
  const key = `${CART_KEY}.consumed.${orderId}`
  let persisted = false
  try { persisted = browserStorage?.getItem(key) === 'true' } catch { /* use memory fallback */ }
  if (persisted || consumedOrders.has(orderId)) return
  for (const item of items) {
    if (item.productType !== 'physical' || !item.cartLineId) continue
    const line = cart.read().find((entry) => entry.id === item.cartLineId)
    if (!line) continue
    const purchasedQuantity = item.quantity ?? 1
    if (line.quantity > purchasedQuantity) cart.update(line.id, line.quantity - purchasedQuantity)
    else cart.remove(line.id)
  }
  consumedOrders.add(orderId)
  try { browserStorage?.setItem(key, 'true') } catch { /* cache remains valid for this tab */ }
}
export const usePhysicalCartLines = (): PhysicalCartLine[] =>
  useSyncExternalStore(subscribePhysicalCart, getPhysicalCartLines, () => emptyLines)

const emptyLines: PhysicalCartLine[] = []
Object.freeze(emptyLines)
