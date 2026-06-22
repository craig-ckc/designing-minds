import { cloneSnapshot } from '../lib/formatters'
import { fixtureSnapshot } from '../fixtures'
import type { CmsRepository, Faq, Product, Subject, Testimonial } from '../types'

/** Read-only wireframe content. Writes are no-ops that echo the input back. */
export const createSeedRepository = (): CmsRepository => ({
  mode: 'seed',
  canWrite: false,
  async getSnapshot() {
    return cloneSnapshot(fixtureSnapshot)
  },
  async saveProduct(product: Product) {
    return product
  },
  async saveSubject(subject: Subject) {
    return subject
  },
  async saveFaq(faq: Faq) {
    return faq
  },
  async saveTestimonial(testimonial: Testimonial) {
    return testimonial
  },
  async reset() {
    return
  },
})
