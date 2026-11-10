/* -------------------------------------------------------------------------
   Account cart persistence, as a pure plan.

   The account copy of the cart is rows in `cart_items`. Writing it as
   "delete everything, then insert" leaves an empty cart if the second request
   fails or two tabs race. Instead we compute the difference between the rows
   that exist and the rows wanted, insert what is missing and delete only what
   was removed, so a failure part-way never loses items that should stay.
   ------------------------------------------------------------------------- */

export interface CartRow {
  id: string
  productId: string | null
  bundleId: string | null
}

export interface CatalogRef {
  id: string
  slug: string
}

export type NewCartRow = { productId: string; bundleId?: undefined } | { bundleId: string; productId?: undefined }

export interface CartWritePlan {
  insert: NewCartRow[]
  /** Ids of rows to delete: items no longer wanted, and duplicates of one that stays. */
  deleteIds: string[]
}

/** What to insert and delete so the cart's rows match the wanted products and bundles. */
export function planCartWrite({ existing, products, bundles }: { existing: readonly CartRow[]; products: readonly CatalogRef[]; bundles: readonly CatalogRef[] }): CartWritePlan {
  const wantedProducts = new Set(products.map((product) => product.id))
  const wantedBundles = new Set(bundles.map((bundle) => bundle.id))
  const keptProducts = new Set<string>()
  const keptBundles = new Set<string>()
  const deleteIds: string[] = []

  for (const row of existing) {
    const kept = row.productId ? keptProducts : keptBundles
    const key = row.productId ?? row.bundleId
    const wanted = row.productId ? wantedProducts : wantedBundles
    if (key && wanted.has(key) && !kept.has(key)) kept.add(key)
    else deleteIds.push(row.id)
  }

  return {
    insert: [
      ...[...wantedProducts].filter((id) => !keptProducts.has(id)).map((productId): NewCartRow => ({ productId })),
      ...[...wantedBundles].filter((id) => !keptBundles.has(id)).map((bundleId): NewCartRow => ({ bundleId })),
    ],
    deleteIds,
  }
}
