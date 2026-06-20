import { cloneSnapshot, updatePageInSnapshot, updateProductInSnapshot } from '../lib/formatters'
import { seedSnapshot } from '../generated/seed'
import type { CmsPage, CmsProduct, CmsRepository, CmsSnapshot } from '../types'

const STORAGE_KEY = 'designing-minds.cms.snapshot'

const hasWindow = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const readSnapshot = (): CmsSnapshot => {
  if (!hasWindow()) {
    return cloneSnapshot(seedSnapshot)
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSnapshot))
    return cloneSnapshot(seedSnapshot)
  }

  try {
    return JSON.parse(raw) as CmsSnapshot
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSnapshot))
    return cloneSnapshot(seedSnapshot)
  }
}

const writeSnapshot = (snapshot: CmsSnapshot) => {
  if (hasWindow()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  }
}

export const createLocalRepository = (): CmsRepository => ({
  mode: 'local',
  canWrite: true,
  async getSnapshot() {
    return readSnapshot()
  },
  async savePage(page: CmsPage) {
    const next = updatePageInSnapshot(readSnapshot(), {
      ...page,
      modified: new Date().toISOString(),
    })
    writeSnapshot(next)
    return next.pages.find((entry) => entry.id === page.id) ?? page
  },
  async saveProduct(product: CmsProduct) {
    const next = updateProductInSnapshot(readSnapshot(), {
      ...product,
      modified: new Date().toISOString(),
      priceLabel: `R${product.priceZar.toLocaleString('en-ZA')}`,
    })
    writeSnapshot(next)
    return next.products.find((entry) => entry.id === product.id) ?? product
  },
  async reset() {
    writeSnapshot(cloneSnapshot(seedSnapshot))
  },
})
