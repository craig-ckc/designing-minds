import { cloneSnapshot } from '../lib/formatters'
import { seedSnapshot } from '../generated/seed'
import type { CmsPage, CmsProduct, CmsRepository } from '../types'

export const createSeedRepository = (): CmsRepository => ({
  mode: 'seed',
  canWrite: false,
  async getSnapshot() {
    return cloneSnapshot(seedSnapshot)
  },
  async savePage(page: CmsPage) {
    return page
  },
  async saveProduct(product: CmsProduct) {
    return product
  },
  async reset() {
    return
  },
})
