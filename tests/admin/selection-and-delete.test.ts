import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createSupabaseRepository } from '../../packages/cms/src/providers/supabase.ts'
import { removeRecordsFromSnapshot } from '../../packages/cms/src/lib/formatters.ts'
import type { CmsSnapshot } from '../../packages/cms/src/types.ts'
import { collectionRegistry } from '../../apps/admin/src/cms/registry.ts'

const read = (path: string) => readFileSync(new URL(`../../apps/admin/src/${path}`, import.meta.url), 'utf8')
const readCms = (path: string) => readFileSync(new URL(`../../packages/cms/src/${path}`, import.meta.url), 'utf8')

/**
 * Source with comments removed. Needed whenever a test asserts something is
 * *absent*: these files explain their own decisions in prose that quotes the
 * code being removed, and a bare `doesNotMatch` reads the explanation as the
 * thing itself. (Same helper as tests/admin/preview-gallery-field.test.ts.)
 */
const readCode = (path: string) =>
  read(path)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

/** Returns the substring from `openParenIndex` (which must point at a `(`) up to and
 * including its matching close paren. Used to isolate one JSX ternary branch from
 * another when they sit inside the same ` ? ( … ) : ( … )` expression. */
function sliceBalanced(source: string, openParenIndex: number): string {
  let depth = 0
  for (let i = openParenIndex; i < source.length; i++) {
    if (source[i] === '(') depth++
    else if (source[i] === ')') {
      depth--
      if (depth === 0) return source.slice(openParenIndex, i + 1)
    }
  }
  throw new Error(`unbalanced parens from index ${openParenIndex}`)
}

/* =========================================================================
   DeletableCollection — derived from the registry, not hardcoded here.
   ========================================================================= */

test('DeletableCollection is exactly the registry\'s non-read-only collections', () => {
  // If this test hardcoded ['products', 'bundles', 'faqs', 'testimonials'] it
  // would stay green forever, including the day someone adds a new editable
  // collection and forgets to make it deletable (or, worse, marks a read-only
  // operational collection deletable by mistake). Deriving the expectation
  // from the registry's own `readOnly` flag is what actually catches that.
  const typesSource = readCms('types.ts')
  const declaration = /export type DeletableCollection = ([^\n]+)/.exec(typesSource)
  assert.ok(declaration, 'packages/cms/src/types.ts should declare DeletableCollection')
  const declared = [...declaration[1].matchAll(/'([^']+)'/g)].map(([, name]) => name).sort()

  const editableIds = collectionRegistry
    .filter((collection) => !collection.readOnly)
    .map((collection) => collection.id)
    .sort()

  assert.deepEqual(declared, editableIds)

  // Named explicitly so a failure here says *which* operational collection
  // leaked in, rather than just "arrays differ".
  for (const id of ['orders', 'customers', 'payments', 'formContact', 'formNewsletter']) {
    assert.ok(!declared.includes(id), `${id} is operational history, not deletable content`)
  }
})

test("the adapter's isDeletable guard agrees with DeletableCollection, not a copy it can drift from", () => {
  const typesSource = readCms('types.ts')
  const declaration = /export type DeletableCollection = ([^\n]+)/.exec(typesSource)
  assert.ok(declaration, 'packages/cms/src/types.ts should declare DeletableCollection')
  const declared = [...declaration[1].matchAll(/'([^']+)'/g)].map(([, name]) => name).sort()

  const adapterSource = read('cms/adapter.ts')
  const list = /const DELETABLE: readonly DeletableCollection\[\] = \[([^\]]+)\]/.exec(adapterSource)
  assert.ok(list, 'adapter.ts should declare the DELETABLE list isDeletable checks against')
  const adapterDeletable = [...list[1].matchAll(/'([^']+)'/g)].map(([, name]) => name).sort()

  assert.deepEqual(adapterDeletable, declared)
})

test('adapter.remove refuses a non-deletable collection before ever touching the repository', () => {
  // Can't call this for real: adapter.ts imports ../lib/supabase, which reads
  // import.meta.env and throws under plain Node (there is no Vite here) — the
  // same reason the gallery-field tests never import adapter.ts either, only
  // read it as text. This is a structural fact about the guard, not a
  // behaviour we can exercise directly.
  const adapterSource = read('cms/adapter.ts')
  const removeFn = adapterSource.slice(adapterSource.indexOf('async remove('), adapterSource.indexOf('async uploadFile('))
  assert.match(removeFn, /if \(!isDeletable\(collectionId\)\) throw new Error/)

  // Must run first — if the repository call happened before the guard, a
  // read-only collection's rows could already be gone by the time it fires.
  const guardIdx = removeFn.indexOf('if (!isDeletable')
  const repoCallIdx = removeFn.indexOf('repository.deleteRecords')
  assert.ok(guardIdx >= 0 && repoCallIdx > guardIdx, 'the isDeletable guard must run before repository.deleteRecords')
})

/* =========================================================================
   Provider — verifies the delete rather than trusting it.

   Row-level security refuses a DELETE *silently*: no error, no rows. These
   run the real `createSupabaseRepository` against a fake postgrest client so
   the assertion is on actual behaviour, not on source text that could say one
   thing and do another.
   ========================================================================= */

function fakeDeleteClient(respond: (ids: string[]) => string[]) {
  const calls: { table: string; column: string; ids: string[]; selectArg: string }[] = []
  let fromCalls = 0
  return {
    calls,
    get fromCalls() {
      return fromCalls
    },
    from(table: string) {
      fromCalls++
      return {
        delete() {
          return {
            in(column: string, ids: string[]) {
              return {
                async select(selectArg: string) {
                  calls.push({ table, column, ids, selectArg })
                  return { data: respond(ids).map((id) => ({ id })), error: null }
                },
              }
            },
          }
        },
      }
    },
  }
}

test('deleteRecords resolves once every requested row comes back removed', async () => {
  const client = fakeDeleteClient((ids) => ids)
  const repo = createSupabaseRepository({ url: 'https://x.test', publishableKey: 'key', client: client as any, audience: 'admin' })
  await assert.doesNotReject(repo.deleteRecords('products', ['p1', 'p2']))
  assert.deepEqual(client.calls, [{ table: 'products', column: 'id', ids: ['p1', 'p2'], selectArg: 'id' }])
})

test('deleteRecords throws when fewer rows come back than were requested (a silent RLS denial)', async () => {
  // The single most important behaviour here: without this check, a delete
  // that row-level security quietly refused is indistinguishable from one
  // that succeeded, and the admin would report success for nothing.
  const client = fakeDeleteClient((ids) => ids.slice(0, 1))
  const repo = createSupabaseRepository({ url: 'https://x.test', publishableKey: 'key', client: client as any, audience: 'admin' })
  await assert.rejects(repo.deleteRecords('products', ['p1', 'p2']), /1 of 2/)
})

test('deleteRecords surfaces a real error from the delete instead of swallowing it', async () => {
  const client = {
    from() {
      return {
        delete() {
          return {
            in() {
              return { async select() { return { data: null, error: { message: 'permission denied for table products' } } } }
            },
          }
        },
      }
    },
  }
  const repo = createSupabaseRepository({ url: 'https://x.test', publishableKey: 'key', client: client as any, audience: 'admin' })
  await assert.rejects(repo.deleteRecords('products', ['p1']), /permission denied/)
})

test('deleteRecords makes no request at all for an empty id list', async () => {
  const client = fakeDeleteClient((ids) => ids)
  const repo = createSupabaseRepository({ url: 'https://x.test', publishableKey: 'key', client: client as any, audience: 'admin' })
  await repo.deleteRecords('products', [])
  assert.equal(client.fromCalls, 0)
  assert.equal(client.calls.length, 0)
})

test('each deletable collection deletes from its own table, not a copy-pasted neighbor', async () => {
  for (const collection of ['products', 'bundles', 'faqs', 'testimonials'] as const) {
    const client = fakeDeleteClient((ids) => ids)
    const repo = createSupabaseRepository({ url: 'https://x.test', publishableKey: 'key', client: client as any, audience: 'admin' })
    await repo.deleteRecords(collection, ['x'])
    assert.equal(client.calls[0]?.table, collection)
  }
})

/* =========================================================================
   removeRecordsFromSnapshot — real objects, not source-reading.
   ========================================================================= */

function makeSnapshot(): CmsSnapshot {
  return {
    products: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
    bundles: [
      { id: 'b1', includedProductIds: ['p1', 'p2', 'p3'], includedProductSlugs: ['p1-slug', 'p2-slug', 'p3-slug'] },
      { id: 'b2', includedProductIds: ['p3'], includedProductSlugs: ['p3-slug'] },
    ],
    faqs: [{ id: 'f1' }, { id: 'f2' }],
    testimonials: [{ id: 't1' }],
    stats: { productCount: 3, subjectCount: 0, gradeCount: 0, bundleCount: 2, orderCount: 0, customerCount: 0 },
  } as unknown as CmsSnapshot
}

test('removeRecordsFromSnapshot(products) drops the product, its position in every bundle, and recomputes productCount', () => {
  const snapshot = makeSnapshot()
  const b2Before = snapshot.bundles[1]
  const next = removeRecordsFromSnapshot(snapshot, 'products', ['p2'])

  assert.deepEqual(next.products.map((p) => p.id), ['p1', 'p3'])

  const b1 = next.bundles.find((b) => b.id === 'b1')!
  assert.deepEqual(b1.includedProductIds, ['p1', 'p3'])
  // The slug at the SAME index has to go with it — matching by value instead
  // of position would silently drop the wrong slug the moment a bundle held
  // a repeated or reordered id.
  assert.deepEqual(b1.includedProductSlugs, ['p1-slug', 'p3-slug'])

  assert.equal(next.stats.productCount, 2)

  // b2 never referenced p2 at all, so it must come back untouched — literally
  // the same object, not a new one with identical contents.
  assert.equal(next.bundles.find((b) => b.id === 'b2'), b2Before)
})

test('removeRecordsFromSnapshot(products) removes every position a deleted id holds, across bundles', () => {
  const snapshot = makeSnapshot()
  const next = removeRecordsFromSnapshot(snapshot, 'products', ['p1', 'p3'])

  const b1 = next.bundles.find((b) => b.id === 'b1')!
  assert.deepEqual(b1.includedProductIds, ['p2'])
  assert.deepEqual(b1.includedProductSlugs, ['p2-slug'])

  // b2 only ever held p3, so it ends up with no members at all.
  const b2 = next.bundles.find((b) => b.id === 'b2')!
  assert.deepEqual(b2.includedProductIds, [])
  assert.deepEqual(b2.includedProductSlugs, [])
})

test('removeRecordsFromSnapshot(bundles) recomputes bundleCount and leaves products alone', () => {
  const snapshot = makeSnapshot()
  const next = removeRecordsFromSnapshot(snapshot, 'bundles', ['b1'])
  assert.deepEqual(next.bundles.map((b) => b.id), ['b2'])
  assert.equal(next.stats.bundleCount, 1)
  assert.equal(next.products, snapshot.products)
})

test('removeRecordsFromSnapshot(faqs) filters the array; there is no faq count in stats to update', () => {
  const snapshot = makeSnapshot()
  const next = removeRecordsFromSnapshot(snapshot, 'faqs', ['f1'])
  assert.deepEqual(next.faqs.map((f) => f.id), ['f2'])
  assert.equal(next.stats, snapshot.stats)
})

test('removeRecordsFromSnapshot ignores an id that matches nothing', () => {
  const snapshot = makeSnapshot()
  const next = removeRecordsFromSnapshot(snapshot, 'products', ['does-not-exist'])
  assert.deepEqual(next.products, snapshot.products)
  assert.deepEqual(next.bundles, snapshot.bundles)
  assert.equal(next.stats.productCount, snapshot.stats.productCount)
})

test('removeRecordsFromSnapshot short-circuits on an empty id list, returning the same snapshot', () => {
  const snapshot = makeSnapshot()
  assert.equal(removeRecordsFromSnapshot(snapshot, 'products', []), snapshot)
})

/* =========================================================================
   RecordsToolbar — one bar, re-tenanted, not a second strip.
   ========================================================================= */

test('while selecting, Cancel is reachable with nothing selected, and Export/Delete/bulk-status are not', () => {
  const toolbar = readCode('components/workspace/RecordsToolbar.tsx')

  const selectingMarker = '{selecting ? ('
  const selectingIdx = toolbar.indexOf(selectingMarker)
  assert.ok(selectingIdx >= 0, 'RecordsToolbar should branch on `selecting`')
  const selectingBlock = sliceBalanced(toolbar, selectingIdx + selectingMarker.length - 1)

  // New/Import belong to browsing only — they must not exist anywhere in the
  // selecting branch, gated or not.
  assert.doesNotMatch(selectingBlock, /onNew/)
  assert.doesNotMatch(selectingBlock, /onImport/)

  const gatedMarker = '{selectedCount > 0 ? ('
  const gatedIdx = selectingBlock.indexOf(gatedMarker)
  assert.ok(gatedIdx >= 0, 'the selecting branch should gate its action buttons on selectedCount > 0')
  const gatedBlock = sliceBalanced(selectingBlock, gatedIdx + gatedMarker.length - 1)

  // Everything destructive or export-like lives inside the gated block...
  assert.match(gatedBlock, /onClick=\{onExport\}/)
  assert.match(gatedBlock, /onClick=\{onDelete\}/)
  assert.match(gatedBlock, /onBulkStatus\(true\)/)
  assert.match(gatedBlock, /onBulkStatus\(false\)/)

  // ...while Cancel sits outside it, in the remainder of the selecting branch,
  // so it renders no matter how many rows are selected.
  const remainder = selectingBlock.slice(gatedIdx + gatedBlock.length)
  assert.match(remainder, /onClick=\{onCancelSelecting\}/)
  assert.doesNotMatch(gatedBlock, /onCancelSelecting/, 'Cancel must not be nested inside the selectedCount > 0 gate')
})

test('Delete is rendered only when the caller supplies onDelete (read-only / non-deletable collections omit it)', () => {
  const toolbar = readCode('components/workspace/RecordsToolbar.tsx')
  assert.match(toolbar, /\{onDelete \? \(/, 'the Delete button should be conditional on the onDelete prop')
})

/* =========================================================================
   AdminWorkspace — the second selection strip is gone; one toolbar carries
   both modes; delete is gated behind isDeletable and a confirmation.
   ========================================================================= */

test('the old second selection strip is gone from AdminWorkspace — exactly one toolbar renders', () => {
  const workspace = readCode('screens/AdminWorkspace.tsx')
  // This is the strip's own markup, word for word, before it was folded into
  // RecordsToolbar. If any of it reappears, the two-strip layout is back.
  assert.doesNotMatch(workspace, /Select all \{filtered\.length\}/)
  assert.doesNotMatch(workspace, /Export selected/)
  assert.doesNotMatch(workspace, /bg-surface-alt px-4 py-2/)
  assert.equal([...workspace.matchAll(/<RecordsToolbar/g)].length, 1)
})

test('delete is offered only for a writable, deletable collection', () => {
  const workspace = readCode('screens/AdminWorkspace.tsx')
  assert.match(workspace, /const deletable = editable && isDeletable\(collection\.id\)/)
  assert.match(workspace, /onDelete=\{deletable \? \(\) => setConfirmDelete\(true\) : undefined\}/)
})

test('a failed delete keeps the selection, so the error stays attached to the rows it describes', () => {
  const workspace = readCode('screens/AdminWorkspace.tsx')
  assert.match(workspace, /if \(await onDelete\(collection, ids\)\) setSelected\(new Set\(\)\)/)
})

test('delete goes through a confirmation, and the confirm label says the action is permanent', () => {
  const workspace = readCode('screens/AdminWorkspace.tsx')
  // The toolbar's Delete only opens the dialog; the actual delete is wired to
  // the dialog's onConfirm, not to the button itself. If deleteSelected() ever
  // shows up wired anywhere else, a click would skip confirmation entirely.
  const deleteSelectedRefs = [...workspace.matchAll(/deleteSelected/g)].length
  assert.equal(deleteSelectedRefs, 2, 'deleteSelected should be defined once and invoked once, from onConfirm')
  assert.match(workspace, /onConfirm=\{\(\) => void deleteSelected\(\)\}/)
  assert.match(workspace, /confirmLabel=\{`Permanently delete \$\{selected\.size\}`\}/)
})

test('the delete warning names what cascades: products mention bundles and carts, bundles mention carts only, both say orders are unaffected', () => {
  const workspace = readCode('screens/AdminWorkspace.tsx')
  const warningBlock = workspace.slice(workspace.indexOf('const deleteWarning ='), workspace.indexOf('const selectionTitle ='))
  assert.ok(warningBlock.length > 0, 'expected a deleteWarning assignment before selectionTitle')

  const products = /collection\.id === 'products'\s*\?\s*'([^']*)'/.exec(warningBlock)?.[1]
  const bundles = /collection\.id === 'bundles'\s*\?\s*'([^']*)'/.exec(warningBlock)?.[1]
  assert.ok(products, 'expected a products-specific delete warning')
  assert.ok(bundles, 'expected a bundles-specific delete warning')

  assert.match(products!, /bundle/i)
  assert.match(products!, /cart/i)
  assert.match(products!, /orders?.*unaffected/i)

  assert.match(bundles!, /cart/i)
  assert.doesNotMatch(bundles!, /bundle/i, 'a bundle cannot itself be a member of another bundle')
  assert.match(bundles!, /orders?.*unaffected/i)
})
